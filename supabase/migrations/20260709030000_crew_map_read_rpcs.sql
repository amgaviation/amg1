-- Live Crew Availability Map — Phase 3: tiered read APIs.
-- Three SECURITY DEFINER functions, each asserting the caller's role and
-- returning ONLY that tier's shape. Because they are definer-owned they can
-- aggregate over presence rows the caller cannot read directly — the
-- aggregation is the privacy boundary (RLS blocks direct row access).
-- "Active" everywhere = ended_at is null AND expires_at > now().

-- ── Admin — full pins ───────────────────────────────────────────────────
create or replace function public.rpc_map_admin()
returns table (
  crew_id uuid, full_name text, avatar_path text,
  airport_code text, latitude numeric, longitude numeric,
  started_at timestamptz, expires_at timestamptz,
  phone text, email text, total_time numeric,
  type_ratings text[], desired_day_rate numeric, availability_status text
) language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('admin','super_admin') and status = 'approved') then
    raise exception 'Admin access required' using errcode = 'insufficient_privilege';
  end if;
  return query
    select s.crew_id, p.full_name, p.avatar_path,
           s.airport_code, s.latitude, s.longitude,
           s.started_at, s.expires_at,
           p.phone, p.email, cp.total_time,
           cp.type_ratings, cp.desired_day_rate, cp.availability_status
    from public.crew_presence_sessions s
    join public.profiles p on p.id = s.crew_id
    join public.crew_profiles cp on cp.id = s.crew_id
    where s.ended_at is null and s.expires_at > now()
    order by s.started_at desc;
end $$;

-- ── Crew — per-airport counts, NO identities ────────────────────────────
create or replace function public.rpc_map_crew()
returns table (airport_code text, name text, latitude numeric, longitude numeric, active_count int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('crew','admin','super_admin') and status = 'approved') then
    raise exception 'Not authorized' using errcode = 'insufficient_privilege';
  end if;
  return query
    select s.airport_code, a.name, s.latitude, s.longitude, count(*)::int
    from public.crew_presence_sessions s
    join public.airports a on a.code = s.airport_code
    where s.ended_at is null and s.expires_at > now()
    group by s.airport_code, a.name, s.latitude, s.longitude
    order by count(*) desc;
end $$;

-- ── Client — aggregates only, NO identities, NO coordinates ─────────────
create or replace function public.rpc_map_client()
returns table (
  total_online_hours numeric, online_count int,
  by_state jsonb, type_ratings_online text[]
) language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'approved') then
    raise exception 'Not authenticated' using errcode = 'insufficient_privilege';
  end if;
  return query
  with active as (
    select distinct on (s.crew_id) s.crew_id, s.airport_code, cp.total_time, cp.type_ratings
    from public.crew_presence_sessions s
    join public.crew_profiles cp on cp.id = s.crew_id
    where s.ended_at is null and s.expires_at > now()
  ),
  states as (
    select coalesce(a.state, 'Unknown') as st,
           count(*)::int as cnt,
           coalesce(sum(act.total_time), 0) as hrs
    from active act
    left join public.airports a on a.code = act.airport_code
    group by coalesce(a.state, 'Unknown')
  )
  select
    coalesce((select sum(total_time) from active), 0) as total_online_hours,
    (select count(*) from active)::int as online_count,
    coalesce(
      (select jsonb_agg(jsonb_build_object('state', st, 'count', cnt, 'hours', hrs) order by cnt desc)
       from states), '[]'::jsonb) as by_state,
    coalesce(
      (select array_agg(distinct tr) from active, unnest(active.type_ratings) as tr where tr is not null),
      '{}'::text[]) as type_ratings_online;
end $$;

grant execute on function public.rpc_map_admin() to authenticated;
grant execute on function public.rpc_map_crew() to authenticated;
grant execute on function public.rpc_map_client() to authenticated;
