-- Live Crew Availability Map — Phase 2: backend logic.
-- All presence writes flow through SECURITY DEFINER functions; clients never
-- write these tables directly. availability_status vocab is {available,limited,
-- unavailable}; "assigned" statuses are {accepted,completed}; a current medical
-- is credential_type='First Class Medical' with status in {approved,expiring}
-- and a future (or null) expiration (verified against the live schema).

-- ── broadcast ping (crew/clients can't read rows; they refetch on ping) ──
create or replace function public.fn_broadcast_presence_change()
returns void language plpgsql security definer set search_path = public as $$
begin
  begin
    perform realtime.send(
      jsonb_build_object('at', extract(epoch from now())),
      'presence_changed', 'crew-presence', false
    );
  exception when others then
    null;  -- a broadcast failure must never break the presence mutation
  end;
end $$;

-- ── restore availability when a session ends (no other open session) ────
create or replace function public.fn_restore_availability(p_crew uuid, p_prior text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.crew_presence_sessions
    where crew_id = p_crew and ended_at is null
  ) then
    -- Only restore if we still own the 'available' flag — never clobber a
    -- status the crew changed by hand while active.
    update public.crew_profiles
      set availability_status = coalesce(nullif(p_prior, ''), 'available')
      where id = p_crew and availability_status = 'available';
  end if;
end $$;

-- ── eligibility ─────────────────────────────────────────────────────────
create or replace function public.fn_crew_has_current_medical(p_crew uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.crew_credentials c
    where c.crew_id = p_crew
      and c.credential_type = 'First Class Medical'
      and c.status in ('approved', 'expiring')
      and (c.expiration_date is null or c.expiration_date > current_date)
  )
  or coalesce(
    (select medical_expiration_date from public.crew_profiles where id = p_crew) > current_date,
    false
  );
$$;

create or replace function public.fn_crew_can_go_active(p_crew uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles pr
    where pr.id = p_crew and pr.role = 'crew' and pr.status = 'approved'
  ) and public.fn_crew_has_current_medical(p_crew);
$$;

create or replace function public.fn_crew_go_active_blockers(p_crew uuid)
returns text[] language plpgsql stable security definer set search_path = public as $$
declare v text[] := '{}';
begin
  if not exists (select 1 from public.profiles where id = p_crew and role = 'crew') then
    v := array_append(v, 'This feature is available to crew accounts only.');
  elsif not exists (select 1 from public.profiles where id = p_crew and status = 'approved') then
    v := array_append(v, 'Your account is not approved yet.');
  end if;
  if not public.fn_crew_has_current_medical(p_crew) then
    v := array_append(v, 'Your First Class Medical is expired or not on file — update your credentials to appear on the map.');
  end if;
  return v;
end $$;

-- ── go active / go offline ──────────────────────────────────────────────
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

  update public.crew_presence_sessions
    set ended_at = now(), ended_reason = 'manual'
    where crew_id = v_crew and ended_at is null;

  select availability_status into v_prior from public.crew_profiles where id = v_crew;

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

create or replace function public.rpc_crew_go_offline()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_crew uuid := auth.uid();
  v_prior text;
begin
  if v_crew is null then raise exception 'Not authenticated'; end if;
  update public.crew_presence_sessions
    set ended_at = now(), ended_reason = 'manual'
    where crew_id = v_crew and ended_at is null
    returning prior_availability_status into v_prior;
  if found then
    perform public.fn_restore_availability(v_crew, v_prior);
    perform public.fn_broadcast_presence_change();
  end if;
end $$;

-- ── expiry finalizer (pg_cron, every minute) ────────────────────────────
create or replace function public.fn_expire_presence()
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_any boolean := false;
begin
  for r in
    select id, crew_id, prior_availability_status, expires_at
    from public.crew_presence_sessions
    where ended_at is null and expires_at <= now()
  loop
    update public.crew_presence_sessions
      set ended_at = r.expires_at, ended_reason = 'expired'
      where id = r.id;
    perform public.fn_restore_availability(r.crew_id, r.prior_availability_status);
    v_any := true;
  end loop;
  if v_any then perform public.fn_broadcast_presence_change(); end if;
end $$;

-- ── auto-remove on mission assignment ───────────────────────────────────
create or replace function public.fn_presence_on_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_prior text;
begin
  if new.status in ('accepted', 'completed') then
    update public.crew_presence_sessions
      set ended_at = now(), ended_reason = 'assigned'
      where crew_id = new.crew_id and ended_at is null
      returning prior_availability_status into v_prior;
    if found then
      perform public.fn_restore_availability(new.crew_id, v_prior);
      perform public.fn_broadcast_presence_change();
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_presence_on_assignment on public.mission_crew_assignments;
create trigger trg_presence_on_assignment
  after insert or update of status on public.mission_crew_assignments
  for each row execute function public.fn_presence_on_assignment();

-- ── RLS policies ────────────────────────────────────────────────────────
-- airports: readable by any authenticated user; writes are admin/seed only.
drop policy if exists airports_select on public.airports;
create policy airports_select on public.airports for select to authenticated using (true);

-- presence: admins read all rows; a crew member reads only their own. No
-- direct writes for anyone — the SECURITY DEFINER functions above bypass RLS.
drop policy if exists presence_select_admin on public.crew_presence_sessions;
create policy presence_select_admin on public.crew_presence_sessions
  for select to authenticated using (
    exists (select 1 from public.profiles
            where id = auth.uid() and role in ('admin','super_admin') and status = 'approved')
  );
drop policy if exists presence_select_self on public.crew_presence_sessions;
create policy presence_select_self on public.crew_presence_sessions
  for select to authenticated using (crew_id = auth.uid());

-- ── grants ──────────────────────────────────────────────────────────────
grant execute on function public.rpc_crew_go_active(text, int) to authenticated;
grant execute on function public.rpc_crew_go_offline() to authenticated;
grant execute on function public.fn_crew_can_go_active(uuid) to authenticated;
grant execute on function public.fn_crew_go_active_blockers(uuid) to authenticated;
grant execute on function public.fn_crew_has_current_medical(uuid) to authenticated;
-- internal-only helpers: not directly callable by clients.
revoke execute on function public.fn_restore_availability(uuid, text) from public;
revoke execute on function public.fn_expire_presence() from public;
revoke execute on function public.fn_broadcast_presence_change() from public;

-- ── cron: finalize expired sessions every minute ────────────────────────
select cron.schedule('expire_crew_presence', '* * * * *', $$ select public.fn_expire_presence(); $$);
