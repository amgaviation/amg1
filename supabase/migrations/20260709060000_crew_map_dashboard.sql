-- Live Crew Map → Command-Center redesign: richer map RPCs + dashboard stats.
-- Adds airport metadata (name/city/state) to the map pins so the client can
-- render Command-Center hover cards and shade active states, and adds two
-- role-gated SECURITY DEFINER stat RPCs that power the surrounding data widgets.
-- Privacy tiers are unchanged: admin sees identities, crew/client see aggregates.

-- ── Admin pins: add airport name/city/state ─────────────────────────────
drop function if exists public.rpc_map_admin();
create function public.rpc_map_admin()
returns table (
  crew_id uuid, full_name text, avatar_path text,
  airport_code text, airport_name text, city text, state text,
  latitude numeric, longitude numeric,
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
           s.airport_code, a.name, a.city, a.state,
           s.latitude, s.longitude,
           s.started_at, s.expires_at,
           p.phone, p.email, cp.total_time,
           cp.type_ratings, cp.desired_day_rate, cp.availability_status
    from public.crew_presence_sessions s
    join public.profiles p on p.id = s.crew_id
    join public.crew_profiles cp on cp.id = s.crew_id
    left join public.airports a on a.code = s.airport_code
    where s.ended_at is null and s.expires_at > now()
    order by s.started_at desc;
end $$;
grant execute on function public.rpc_map_admin() to authenticated;

-- ── Crew rollups: add airport city/state (coords already the airport's) ──
drop function if exists public.rpc_map_crew();
create function public.rpc_map_crew()
returns table (airport_code text, name text, city text, state text,
               latitude numeric, longitude numeric, active_count int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('crew','admin','super_admin') and status = 'approved') then
    raise exception 'Not authorized' using errcode = 'insufficient_privilege';
  end if;
  return query
    select s.airport_code, a.name, a.city, a.state, a.latitude, a.longitude, count(*)::int
    from public.crew_presence_sessions s
    join public.airports a on a.code = s.airport_code
    where s.ended_at is null and s.expires_at > now()
    group by s.airport_code, a.name, a.city, a.state, a.latitude, a.longitude
    order by count(*) desc;
end $$;
grant execute on function public.rpc_map_crew() to authenticated;

-- ── Admin dashboard stats (crew + map + mission + history) ──────────────
create or replace function public.rpc_crew_map_admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('admin','super_admin') and status = 'approved') then
    raise exception 'Admin access required' using errcode = 'insufficient_privilege';
  end if;
  with online as (
    select distinct on (s.crew_id) s.crew_id, s.airport_code, cp.total_time, cp.type_ratings
    from public.crew_presence_sessions s
    join public.crew_profiles cp on cp.id = s.crew_id
    where s.ended_at is null and s.expires_at > now()
  ),
  ratings as (
    select distinct tr from online, unnest(coalesce(online.type_ratings, array[]::text[])) tr
    where tr is not null and tr <> ''
  ),
  days as (
    select array_agg(cnt order by d) as arr from (
      select gd::date d,
             (select count(*) from public.crew_presence_sessions s
              where s.started_at >= gd and s.started_at < gd + interval '1 day') cnt
      from generate_series(date_trunc('day', now()) - interval '6 days',
                           date_trunc('day', now()), interval '1 day') gd
    ) z
  )
  select jsonb_build_object(
    'online_count', (select count(*) from online),
    'airports_active', (select count(distinct airport_code) from online),
    'states_active', (select count(distinct a.state) from online o
                      join public.airports a on a.code = o.airport_code where a.state is not null),
    'hours_online', coalesce((select sum(total_time) from online), 0),
    'type_ratings_count', (select count(*) from ratings),
    'active_now', (select count(*) from public.crew_presence_sessions
                   where ended_at is null and expires_at > now()),
    'sessions_today', (select count(*) from public.crew_presence_sessions
                       where started_at >= date_trunc('day', now())),
    'avg_session_minutes', coalesce((select round(avg(extract(epoch from (ended_at - started_at)) / 60))
                                     from public.crew_presence_sessions
                                     where ended_at >= date_trunc('day', now())), 0),
    'assignments_from_map_today', (select count(*) from public.crew_presence_sessions
                                   where ended_reason = 'assigned' and ended_at >= date_trunc('day', now())),
    'sessions_7d', coalesce((select arr from days), '{}'::bigint[]),
    'active_missions', (select count(*) from public.missions
                        where status in ('approved','crew_assigned','scheduled','in_progress')),
    'pool_missions', (select count(*) from public.missions where pool_visible = true),
    'missions_today', (select count(*) from public.missions
                       where requested_departure >= date_trunc('day', now())
                         and requested_departure < date_trunc('day', now()) + interval '1 day')
  ) into result;
  return result;
end $$;
grant execute on function public.rpc_crew_map_admin_stats() to authenticated;

-- ── Crew dashboard stats (aggregate only, no identities) ────────────────
create or replace function public.rpc_crew_map_crew_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('crew','admin','super_admin') and status = 'approved') then
    raise exception 'Not authorized' using errcode = 'insufficient_privilege';
  end if;
  with online as (
    select distinct on (s.crew_id) s.crew_id, s.airport_code, cp.total_time, cp.type_ratings
    from public.crew_presence_sessions s
    join public.crew_profiles cp on cp.id = s.crew_id
    where s.ended_at is null and s.expires_at > now()
  ),
  ratings as (
    select distinct tr from online, unnest(coalesce(online.type_ratings, array[]::text[])) tr
    where tr is not null and tr <> ''
  ),
  busiest as (
    select o.airport_code, a.name, count(*)::int cnt
    from online o join public.airports a on a.code = o.airport_code
    group by o.airport_code, a.name order by count(*) desc limit 1
  )
  select jsonb_build_object(
    'online_count', (select count(*) from online),
    'airports_active', (select count(distinct airport_code) from online),
    'hours_online', coalesce((select sum(total_time) from online), 0),
    'type_ratings_count', (select count(*) from ratings),
    'busiest_airport', (select jsonb_build_object('code', airport_code, 'name', name, 'count', cnt) from busiest)
  ) into result;
  return result;
end $$;
grant execute on function public.rpc_crew_map_crew_stats() to authenticated;
