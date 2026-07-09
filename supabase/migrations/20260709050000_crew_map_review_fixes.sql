-- Live Crew Availability Map — review fixes (privacy + correctness).
-- Addresses three findings from the post-build review:
--   HIGH  self-reported medical date could override a failed verified check
--   MED   prior availability_status clobbered when a crew switches airports
--   NIT   per-airport pins keyed off session-snapshot coords, not the airport's

-- ── HIGH: medical eligibility can no longer be self-asserted over a failed
--         reviewed credential ────────────────────────────────────────────
-- Trust model: a reviewed 'First Class Medical' credential is authoritative.
-- crew_profiles.medical_expiration_date is crew-editable (Settings + onboarding),
-- so it is only a FALLBACK for crew who have NO reviewed medical on file at all.
-- It can never resurrect eligibility for a crew whose reviewed medical is
-- expired/rejected — that crew has a credential row, so the fallback is disabled
-- and the verified check governs. A crew member cannot type their way onto the
-- map once a medical has been reviewed.
create or replace function public.fn_crew_has_current_medical(p_crew uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (
      select 1 from public.crew_credentials c
      where c.crew_id = p_crew
        and c.credential_type = 'First Class Medical'
        and c.status in ('approved', 'expiring')
        and (c.expiration_date is null or c.expiration_date > current_date)
    )
    or (
      -- fallback applies ONLY when no reviewed medical exists at all
      not exists (
        select 1 from public.crew_credentials c
        where c.crew_id = p_crew
          and c.credential_type = 'First Class Medical'
      )
      and coalesce(
        (select medical_expiration_date from public.crew_profiles where id = p_crew) > current_date,
        false
      )
    );
$$;

-- ── MED: carry the true pre-map availability forward across airport switches ─
-- Previously, re-activating (going active at a second airport without going
-- offline) re-read availability_status from crew_profiles — which the first
-- activation had already set to 'available' — and stored THAT as the new
-- session's prior. On restore, a crew who was 'limited'/'unavailable' before
-- ever touching the map would be overwritten to 'available'. Now, when we close
-- an existing open session we carry its captured prior forward untouched, and
-- only read crew_profiles when there was no open session to inherit from.
create or replace function public.rpc_crew_go_active(p_airport text, p_duration_minutes int)
returns public.crew_presence_sessions
language plpgsql security definer set search_path = public as $$
declare
  v_crew uuid := auth.uid();
  v_apt  public.airports;
  v_prior text;
  v_dur  int;
  v_session public.crew_presence_sessions;
begin
  if v_crew is null then raise exception 'Not authenticated'; end if;
  if not public.fn_crew_can_go_active(v_crew) then
    raise exception 'Not eligible: %', array_to_string(public.fn_crew_go_active_blockers(v_crew), ' ');
  end if;

  v_dur := greatest(1, least(coalesce(p_duration_minutes, 60), 360));  -- 6h hard cap

  select * into v_apt from public.airports
    where code = upper(btrim(p_airport)) and is_active;
  if v_apt.code is null then
    raise exception 'Unknown airport: %', p_airport using errcode = 'no_data_found';
  end if;

  -- Close any existing open session and inherit its captured prior status.
  update public.crew_presence_sessions
    set ended_at = now(), ended_reason = 'manual'
    where crew_id = v_crew and ended_at is null
    returning prior_availability_status into v_prior;
  if not found then
    -- No open session to inherit from: this is the real pre-map status.
    select availability_status into v_prior from public.crew_profiles where id = v_crew;
  end if;

  insert into public.crew_presence_sessions
    (crew_id, airport_code, latitude, longitude, duration_minutes, expires_at, prior_availability_status)
  values
    (v_crew, v_apt.code, v_apt.latitude, v_apt.longitude, v_dur,
     now() + make_interval(mins => v_dur), v_prior)
  returning * into v_session;

  update public.crew_profiles set availability_status = 'available' where id = v_crew;
  perform public.fn_broadcast_presence_change();
  return v_session;
end $$;

-- ── NIT: key per-airport crew pins off the airport's own coordinates ────────
-- Group and return a.latitude/a.longitude (the airport reference coords) rather
-- than the per-session snapshot coords, so one airport is always one pin even
-- if a session captured slightly different coordinates.
create or replace function public.rpc_map_crew()
returns table (airport_code text, name text, latitude numeric, longitude numeric, active_count int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('crew','admin','super_admin') and status = 'approved') then
    raise exception 'Not authorized' using errcode = 'insufficient_privilege';
  end if;
  return query
    select s.airport_code, a.name, a.latitude, a.longitude, count(*)::int
    from public.crew_presence_sessions s
    join public.airports a on a.code = s.airport_code
    where s.ended_at is null and s.expires_at > now()
    group by s.airport_code, a.name, a.latitude, a.longitude
    order by count(*) desc;
end $$;
