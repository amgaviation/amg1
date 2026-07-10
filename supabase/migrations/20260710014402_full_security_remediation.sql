-- Stop-ship security remediation for AMG Connect.
-- This migration is intentionally self-contained because the historical local
-- and hosted migration ledgers have diverged. Apply this exact SQL once through
-- the Supabase Management API; do not replay the repository migration history.

set lock_timeout = '5s';
set statement_timeout = '60s';

-- ---------------------------------------------------------------------------
-- Canonical identity and authorization helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_approved_portal_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'approved'
      and p.is_active is true
      and p.is_deleted is not true
      and p.role in ('client', 'crew', 'admin', 'partner', 'super_admin')
  );
$function$;

create or replace function public.is_approved_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'approved'
      and p.is_active is true
      and p.is_deleted is not true
      and p.role in ('admin', 'super_admin')
  );
$function$;

create or replace function public.is_approved_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.status = 'approved'
      and p.is_active is true
      and p.is_deleted is not true
      and p.role = 'super_admin'
  );
$function$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.is_approved_admin();
$function$;

-- Kept for policy compatibility, but no longer exposed to session roles.
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.status = 'approved'
    and p.is_active is true
    and p.is_deleted is not true;
$function$;

create or replace function public.is_crew_on_mission(p_mission uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.is_approved_portal_user()
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'crew'
    )
    and (
      exists (
        select 1
        from public.mission_crew_assignments mca
        where mca.mission_id = p_mission
          and mca.crew_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.missions m
        where m.id = p_mission
          and m.assigned_crew_id = (select auth.uid())
      )
    );
$function$;

create or replace function public.is_partner_on_mission(p_mission uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.is_approved_portal_user()
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'partner'
    )
    and exists (
      select 1
      from public.mission_partner_assignments mpa
      where mpa.mission_id = p_mission
        and mpa.partner_id = (select auth.uid())
    );
$function$;

-- Auth metadata is descriptive input only. It can never grant authority.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_business_purpose text;
begin
  v_business_purpose := case
    when lower(btrim(coalesce(new.raw_user_meta_data ->> 'business_purpose', '')))
      in ('client', 'crew', 'vendor', 'broker', 'other')
    then lower(btrim(new.raw_user_meta_data ->> 'business_purpose'))
    else 'other'
  end;

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    is_active,
    is_deleted,
    business_purpose
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    'client',
    'pending_approval',
    false,
    false,
    v_business_purpose
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    business_purpose = excluded.business_purpose,
    updated_at = now();

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Crew-map RPCs: caller checks and subject-status privacy
-- ---------------------------------------------------------------------------

create or replace function public.fn_crew_can_go_active(p_crew uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_crew = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = p_crew
        and p.role = 'crew'
        and p.status = 'approved'
        and p.is_active is true
        and p.is_deleted is not true
    )
    and public.fn_crew_has_current_medical(p_crew);
$function$;

create or replace function public.fn_crew_go_active_blockers(p_crew uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v text[] := '{}';
begin
  if p_crew is distinct from (select auth.uid()) then
    return array['Not authorized.'];
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_crew
      and p.role = 'crew'
      and p.status = 'approved'
      and p.is_active is true
      and p.is_deleted is not true
  ) then
    v := array_append(v, 'Your crew account is not approved and active.');
  elsif not public.fn_crew_has_current_medical(p_crew) then
    v := array_append(
      v,
      'Your First Class Medical is expired or not on file — update your credentials to appear on the map.'
    );
  end if;

  return v;
end;
$function$;

create or replace function public.rpc_crew_go_active(
  p_airport text,
  p_duration_minutes integer
)
returns public.crew_presence_sessions
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_crew uuid := auth.uid();
  v_apt public.airports;
  v_prior text;
  v_dur integer;
  v_session public.crew_presence_sessions;
begin
  if v_crew is null or not public.fn_crew_can_go_active(v_crew) then
    raise exception 'Not eligible: %',
      array_to_string(public.fn_crew_go_active_blockers(v_crew), ' ')
      using errcode = 'insufficient_privilege';
  end if;

  v_dur := greatest(1, least(coalesce(p_duration_minutes, 60), 360));

  select *
  into v_apt
  from public.airports a
  where a.code = upper(btrim(p_airport)) and a.is_active;

  if v_apt.code is null then
    raise exception 'Unknown airport: %', p_airport using errcode = 'no_data_found';
  end if;

  update public.crew_presence_sessions
  set ended_at = now(), ended_reason = 'manual'
  where crew_id = v_crew and ended_at is null
  returning prior_availability_status into v_prior;

  if not found then
    select cp.availability_status
    into v_prior
    from public.crew_profiles cp
    where cp.id = v_crew;
  end if;

  insert into public.crew_presence_sessions (
    crew_id,
    airport_code,
    latitude,
    longitude,
    duration_minutes,
    expires_at,
    prior_availability_status
  )
  values (
    v_crew,
    v_apt.code,
    v_apt.latitude,
    v_apt.longitude,
    v_dur,
    now() + make_interval(mins => v_dur),
    v_prior
  )
  returning * into v_session;

  update public.crew_profiles
  set availability_status = 'available'
  where id = v_crew;

  perform public.fn_broadcast_presence_change();
  return v_session;
end;
$function$;

create or replace function public.rpc_crew_go_offline()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_crew uuid := auth.uid();
  v_prior text;
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = v_crew
      and p.role = 'crew'
      and p.status = 'approved'
      and p.is_active is true
      and p.is_deleted is not true
  ) then
    raise exception 'Not authorized' using errcode = 'insufficient_privilege';
  end if;

  update public.crew_presence_sessions
  set ended_at = now(), ended_reason = 'manual'
  where crew_id = v_crew and ended_at is null
  returning prior_availability_status into v_prior;

  if found then
    perform public.fn_restore_availability(v_crew, v_prior);
    perform public.fn_broadcast_presence_change();
  end if;
end;
$function$;

create or replace function public.rpc_map_admin()
returns table (
  crew_id uuid,
  full_name text,
  avatar_path text,
  airport_code text,
  airport_name text,
  city text,
  state text,
  latitude numeric,
  longitude numeric,
  started_at timestamptz,
  expires_at timestamptz,
  phone text,
  email text,
  total_time numeric,
  type_ratings text[],
  desired_day_rate numeric,
  availability_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not public.is_approved_admin() then
    raise exception 'Admin access required' using errcode = 'insufficient_privilege';
  end if;

  return query
  select
    s.crew_id,
    subject.full_name,
    subject.avatar_path,
    s.airport_code,
    a.name,
    a.city,
    a.state,
    s.latitude,
    s.longitude,
    s.started_at,
    s.expires_at,
    subject.phone,
    subject.email,
    cp.total_time,
    cp.type_ratings,
    cp.desired_day_rate,
    cp.availability_status
  from public.crew_presence_sessions s
  join public.profiles subject
    on subject.id = s.crew_id
   and subject.role = 'crew'
   and subject.status = 'approved'
   and subject.is_active is true
   and subject.is_deleted is not true
  join public.crew_profiles cp on cp.id = s.crew_id
  left join public.airports a on a.code = s.airport_code
  where s.ended_at is null and s.expires_at > now()
  order by s.started_at desc;
end;
$function$;

create or replace function public.rpc_map_crew()
returns table (
  airport_code text,
  name text,
  city text,
  state text,
  latitude numeric,
  longitude numeric,
  active_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not public.is_approved_portal_user() or not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('crew', 'admin', 'super_admin')
  ) then
    raise exception 'Not authorized' using errcode = 'insufficient_privilege';
  end if;

  return query
  select
    s.airport_code,
    a.name,
    a.city,
    a.state,
    a.latitude,
    a.longitude,
    count(*)::integer
  from public.crew_presence_sessions s
  join public.profiles subject
    on subject.id = s.crew_id
   and subject.role = 'crew'
   and subject.status = 'approved'
   and subject.is_active is true
   and subject.is_deleted is not true
  join public.airports a on a.code = s.airport_code
  where s.ended_at is null and s.expires_at > now()
  group by s.airport_code, a.name, a.city, a.state, a.latitude, a.longitude
  order by count(*) desc;
end;
$function$;

create or replace function public.rpc_map_client()
returns table (
  total_online_hours numeric,
  online_count integer,
  by_state jsonb,
  type_ratings_online text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not public.is_approved_portal_user() then
    raise exception 'Not authorized' using errcode = 'insufficient_privilege';
  end if;

  return query
  with active as (
    select distinct on (s.crew_id)
      s.crew_id,
      s.airport_code,
      cp.total_time,
      cp.type_ratings
    from public.crew_presence_sessions s
    join public.profiles subject
      on subject.id = s.crew_id
     and subject.role = 'crew'
     and subject.status = 'approved'
     and subject.is_active is true
     and subject.is_deleted is not true
    join public.crew_profiles cp on cp.id = s.crew_id
    where s.ended_at is null and s.expires_at > now()
  ),
  states as (
    select
      coalesce(a.state, 'Unknown') as st,
      count(*)::integer as cnt,
      coalesce(sum(active.total_time), 0) as hrs
    from active
    left join public.airports a on a.code = active.airport_code
    group by coalesce(a.state, 'Unknown')
  )
  select
    coalesce((select sum(active.total_time) from active), 0),
    (select count(*) from active)::integer,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('state', states.st, 'count', states.cnt, 'hours', states.hrs)
          order by states.cnt desc
        )
        from states
      ),
      '[]'::jsonb
    ),
    coalesce(
      (
        select array_agg(distinct tr)
        from active, unnest(active.type_ratings) as tr
        where tr is not null
      ),
      '{}'::text[]
    );
end;
$function$;

create or replace function public.rpc_crew_map_admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  result jsonb;
begin
  if not public.is_approved_admin() then
    raise exception 'Admin access required' using errcode = 'insufficient_privilege';
  end if;

  with online as (
    select distinct on (s.crew_id)
      s.crew_id,
      s.airport_code,
      cp.total_time,
      cp.type_ratings
    from public.crew_presence_sessions s
    join public.profiles subject
      on subject.id = s.crew_id
     and subject.role = 'crew'
     and subject.status = 'approved'
     and subject.is_active is true
     and subject.is_deleted is not true
    join public.crew_profiles cp on cp.id = s.crew_id
    where s.ended_at is null and s.expires_at > now()
  ),
  ratings as (
    select distinct tr
    from online, unnest(coalesce(online.type_ratings, array[]::text[])) tr
    where tr is not null and tr <> ''
  ),
  days as (
    select array_agg(cnt order by d) as arr
    from (
      select
        gd::date as d,
        (
          select count(*)
          from public.crew_presence_sessions s
          where s.started_at >= gd and s.started_at < gd + interval '1 day'
        ) as cnt
      from generate_series(
        date_trunc('day', now()) - interval '6 days',
        date_trunc('day', now()),
        interval '1 day'
      ) gd
    ) z
  )
  select jsonb_build_object(
    'online_count', (select count(*) from online),
    'airports_active', (select count(distinct airport_code) from online),
    'states_active', (
      select count(distinct a.state)
      from online o
      join public.airports a on a.code = o.airport_code
      where a.state is not null
    ),
    'hours_online', coalesce((select sum(total_time) from online), 0),
    'type_ratings_count', (select count(*) from ratings),
    'active_now', (select count(*) from online),
    'sessions_today', (
      select count(*)
      from public.crew_presence_sessions s
      where s.started_at >= date_trunc('day', now())
    ),
    'avg_session_minutes', coalesce((
      select round(avg(extract(epoch from (s.ended_at - s.started_at)) / 60))
      from public.crew_presence_sessions s
      where s.ended_at >= date_trunc('day', now())
    ), 0),
    'assignments_from_map_today', (
      select count(*)
      from public.crew_presence_sessions s
      where s.ended_reason = 'assigned'
        and s.ended_at >= date_trunc('day', now())
    ),
    'sessions_7d', coalesce((select arr from days), '{}'::bigint[]),
    'active_missions', (
      select count(*)
      from public.missions m
      where m.status in ('approved', 'crew_assigned', 'scheduled', 'in_progress')
    ),
    'pool_missions', (select count(*) from public.missions m where m.pool_visible is true),
    'missions_today', (
      select count(*)
      from public.missions m
      where m.requested_departure >= date_trunc('day', now())
        and m.requested_departure < date_trunc('day', now()) + interval '1 day'
    )
  ) into result;

  return result;
end;
$function$;

create or replace function public.rpc_crew_map_crew_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  result jsonb;
begin
  if not public.is_approved_portal_user() or not exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('crew', 'admin', 'super_admin')
  ) then
    raise exception 'Not authorized' using errcode = 'insufficient_privilege';
  end if;

  with online as (
    select distinct on (s.crew_id)
      s.crew_id,
      s.airport_code,
      cp.total_time,
      cp.type_ratings
    from public.crew_presence_sessions s
    join public.profiles subject
      on subject.id = s.crew_id
     and subject.role = 'crew'
     and subject.status = 'approved'
     and subject.is_active is true
     and subject.is_deleted is not true
    join public.crew_profiles cp on cp.id = s.crew_id
    where s.ended_at is null and s.expires_at > now()
  ),
  ratings as (
    select distinct tr
    from online, unnest(coalesce(online.type_ratings, array[]::text[])) tr
    where tr is not null and tr <> ''
  ),
  busiest as (
    select o.airport_code, a.name, count(*)::integer as cnt
    from online o
    join public.airports a on a.code = o.airport_code
    group by o.airport_code, a.name
    order by count(*) desc
    limit 1
  )
  select jsonb_build_object(
    'online_count', (select count(*) from online),
    'airports_active', (select count(distinct airport_code) from online),
    'hours_online', coalesce((select sum(total_time) from online), 0),
    'type_ratings_count', (select count(*) from ratings),
    'busiest_airport', (
      select jsonb_build_object(
        'code', busiest.airport_code,
        'name', busiest.name,
        'count', busiest.cnt
      )
      from busiest
    )
  ) into result;

  return result;
end;
$function$;

create or replace function public.end_crew_presence_on_profile_restriction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.role <> 'crew'
    or new.status <> 'approved'
    or new.is_active is not true
    or new.is_deleted is true
  then
    update public.crew_presence_sessions
    set ended_at = now(), ended_reason = 'admin'
    where crew_id = new.id and ended_at is null;

    if found then
      perform public.fn_broadcast_presence_change();
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_end_crew_presence_on_profile_restriction on public.profiles;
create trigger trg_end_crew_presence_on_profile_restriction
after update of role, status, is_active, is_deleted on public.profiles
for each row
when (
  old.role is distinct from new.role
  or old.status is distinct from new.status
  or old.is_active is distinct from new.is_active
  or old.is_deleted is distinct from new.is_deleted
)
execute function public.end_crew_presence_on_profile_restriction();

-- ---------------------------------------------------------------------------
-- Stripe invoice payment: one row lock, one transaction, one receipt
-- ---------------------------------------------------------------------------

create unique index if not exists payments_provider_checkout_session_id_uidx
on public.payments(provider_checkout_session_id)
where provider_checkout_session_id is not null;

create unique index if not exists payments_provider_payment_id_uidx
on public.payments(provider_payment_id)
where provider_payment_id is not null;

create or replace function public.record_stripe_invoice_payment(
  p_invoice_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_customer_id text,
  p_customer_email text,
  p_amount_total bigint,
  p_currency text,
  p_paid_at timestamptz,
  p_event_id text,
  p_payment_url text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_invoice public.invoices%rowtype;
  v_existing_payment_id uuid;
  v_existing_invoice_id uuid;
  v_intent_payment_id uuid;
  v_intent_invoice_id uuid;
  v_payment_id uuid;
  v_receipt_number text;
  v_expected_cents bigint;
  v_amount numeric;
  v_paid_at timestamptz := coalesce(p_paid_at, now());
begin
  if nullif(btrim(p_checkout_session_id), '') is null
    or p_amount_total is null
    or p_amount_total <= 0
    or p_amount_total > 2147483647
    or nullif(btrim(p_currency), '') is null
  then
    return jsonb_build_object('outcome', 'invalid_input');
  end if;

  select i.*
  into v_invoice
  from public.invoices i
  where i.id = p_invoice_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  select p.id, p.invoice_id
  into v_existing_payment_id, v_existing_invoice_id
  from public.payments p
  where p.provider_checkout_session_id = p_checkout_session_id
     or (
       nullif(btrim(p_payment_intent_id), '') is not null
       and p.provider_payment_id = p_payment_intent_id
     )
  order by (p.provider_checkout_session_id = p_checkout_session_id) desc
  limit 1;

  if found then
    if nullif(btrim(p_payment_intent_id), '') is not null then
      select p.id, p.invoice_id
      into v_intent_payment_id, v_intent_invoice_id
      from public.payments p
      where p.provider_payment_id = p_payment_intent_id
      limit 1;

      if found and (
        v_intent_payment_id is distinct from v_existing_payment_id
        or v_intent_invoice_id is distinct from v_existing_invoice_id
      ) then
        return jsonb_build_object('outcome', 'conflict');
      end if;
    end if;

    return jsonb_build_object(
      'outcome', case when v_existing_invoice_id = p_invoice_id then 'duplicate' else 'conflict' end,
      'payment_id', v_existing_payment_id
    );
  end if;

  if nullif(btrim(p_payment_intent_id), '') is not null then
    select p.id, p.invoice_id
    into v_existing_payment_id, v_existing_invoice_id
    from public.payments p
    where p.provider_payment_id = p_payment_intent_id
    limit 1;

    if found then
      return jsonb_build_object(
        'outcome', case when v_existing_invoice_id = p_invoice_id then 'duplicate' else 'conflict' end,
        'payment_id', v_existing_payment_id
      );
    end if;
  end if;

  v_amount := p_amount_total::numeric / 100;

  if v_invoice.status not in ('sent', 'viewed', 'overdue', 'partially_paid') then
    insert into public.payments (
      invoice_id,
      amount,
      currency,
      payment_method,
      provider,
      provider_payment_id,
      status,
      notes,
      paid_at,
      payment_reference,
      payment_provider,
      payment_provider_session_id,
      payment_link_url,
      payment_status,
      provider_checkout_session_id,
      provider_customer_id,
      raw_event_id
    )
    values (
      p_invoice_id,
      v_amount,
      upper(btrim(p_currency)),
      'card',
      'stripe',
      nullif(btrim(p_payment_intent_id), ''),
      'requires_review',
      format(
        'Stripe payment received after invoice entered %s status; manual reconciliation required',
        v_invoice.status
      ),
      v_paid_at,
      coalesce(nullif(btrim(p_payment_intent_id), ''), p_checkout_session_id),
      'stripe',
      p_checkout_session_id,
      p_payment_url,
      'paid_requires_review',
      p_checkout_session_id,
      nullif(btrim(p_customer_id), ''),
      nullif(btrim(p_event_id), '')
    )
    returning id into v_payment_id;

    update public.invoices
    set
      payment_provider = 'stripe',
      payment_provider_session_id = p_checkout_session_id,
      payment_link_url = coalesce(p_payment_url, v_invoice.payment_link_url),
      payment_status = 'requires_review',
      stripe_checkout_session_id = p_checkout_session_id,
      stripe_payment_intent_id = nullif(btrim(p_payment_intent_id), ''),
      stripe_customer_id = nullif(btrim(p_customer_id), ''),
      stripe_payment_url = coalesce(p_payment_url, v_invoice.stripe_payment_url),
      stripe_payment_status = 'requires_review',
      payment_amount_cents = p_amount_total::integer,
      payment_currency = lower(btrim(p_currency)),
      payment_error = format(
        'Stripe payment %s %s received after invoice entered %s status; manual reconciliation required.',
        v_amount,
        upper(btrim(p_currency)),
        v_invoice.status
      ),
      updated_at = now()
    where id = p_invoice_id;

    insert into public.audit_events (
      actor_id,
      actor_email,
      actor_role,
      action,
      detail,
      entity_type,
      entity_id
    )
    values (
      v_invoice.client_id,
      coalesce(nullif(btrim(p_customer_email), ''), 'stripe-checkout'),
      'client',
      'invoice_payment_requires_review',
      format(
        'Stripe payment %s %s requires reconciliation on %s (status %s, session %s)',
        v_amount,
        upper(btrim(p_currency)),
        v_invoice.invoice_number,
        v_invoice.status,
        p_checkout_session_id
      ),
      'invoice',
      p_invoice_id
    );

    return jsonb_build_object(
      'outcome', 'reconciliation_required',
      'invoice_status', v_invoice.status,
      'payment_id', v_payment_id
    );
  end if;

  v_expected_cents := round(v_invoice.amount_due * 100)::bigint;
  if v_expected_cents is distinct from p_amount_total
    or lower(btrim(v_invoice.currency)) is distinct from lower(btrim(p_currency))
  then
    insert into public.payments (
      invoice_id,
      amount,
      currency,
      payment_method,
      provider,
      provider_payment_id,
      status,
      notes,
      paid_at,
      payment_reference,
      payment_provider,
      payment_provider_session_id,
      payment_link_url,
      payment_status,
      provider_checkout_session_id,
      provider_customer_id,
      raw_event_id
    )
    values (
      p_invoice_id,
      v_amount,
      upper(btrim(p_currency)),
      'card',
      'stripe',
      nullif(btrim(p_payment_intent_id), ''),
      'requires_review',
      format(
        'Stripe captured %s %s; invoice expected %s %s. Manual reconciliation required',
        v_amount,
        upper(btrim(p_currency)),
        v_invoice.amount_due,
        upper(btrim(v_invoice.currency))
      ),
      v_paid_at,
      coalesce(nullif(btrim(p_payment_intent_id), ''), p_checkout_session_id),
      'stripe',
      p_checkout_session_id,
      p_payment_url,
      'paid_requires_review',
      p_checkout_session_id,
      nullif(btrim(p_customer_id), ''),
      nullif(btrim(p_event_id), '')
    )
    returning id into v_payment_id;

    update public.invoices
    set
      payment_provider = 'stripe',
      payment_provider_session_id = p_checkout_session_id,
      payment_link_url = coalesce(p_payment_url, v_invoice.payment_link_url),
      payment_status = 'requires_review',
      stripe_checkout_session_id = p_checkout_session_id,
      stripe_payment_intent_id = nullif(btrim(p_payment_intent_id), ''),
      stripe_customer_id = nullif(btrim(p_customer_id), ''),
      stripe_payment_url = coalesce(p_payment_url, v_invoice.stripe_payment_url),
      stripe_payment_status = 'amount_mismatch',
      payment_amount_cents = p_amount_total::integer,
      payment_currency = lower(btrim(p_currency)),
      payment_error = format(
        'Stripe captured %s %s; invoice expected %s %s. Manual reconciliation required.',
        v_amount,
        upper(btrim(p_currency)),
        v_invoice.amount_due,
        upper(btrim(v_invoice.currency))
      ),
      updated_at = now()
    where id = p_invoice_id;

    insert into public.audit_events (
      actor_id,
      actor_email,
      actor_role,
      action,
      detail,
      entity_type,
      entity_id
    )
    values (
      v_invoice.client_id,
      coalesce(nullif(btrim(p_customer_email), ''), 'stripe-checkout'),
      'client',
      'invoice_payment_requires_review',
      format(
        'Stripe captured %s %s for %s; expected %s %s (session %s)',
        v_amount,
        upper(btrim(p_currency)),
        v_invoice.invoice_number,
        v_invoice.amount_due,
        upper(btrim(v_invoice.currency)),
        p_checkout_session_id
      ),
      'invoice',
      p_invoice_id
    );

    return jsonb_build_object(
      'outcome', 'reconciliation_required',
      'reason', 'amount_mismatch',
      'payment_id', v_payment_id,
      'expected_amount_total', v_expected_cents,
      'expected_currency', lower(btrim(v_invoice.currency))
    );
  end if;

  v_receipt_number := public.next_billing_document_number('receipt');

  insert into public.payments (
    invoice_id,
    amount,
    currency,
    payment_method,
    provider,
    provider_payment_id,
    status,
    notes,
    paid_at,
    payment_reference,
    receipt_number,
    payment_provider,
    payment_provider_session_id,
    payment_link_url,
    payment_status,
    provider_checkout_session_id,
    provider_customer_id,
    raw_event_id
  )
  values (
    p_invoice_id,
    v_amount,
    upper(btrim(p_currency)),
    'card',
    'stripe',
    nullif(btrim(p_payment_intent_id), ''),
    'recorded',
    'Stripe Checkout payment',
    v_paid_at,
    coalesce(nullif(btrim(p_payment_intent_id), ''), p_checkout_session_id),
    v_receipt_number,
    'stripe',
    p_checkout_session_id,
    p_payment_url,
    'paid',
    p_checkout_session_id,
    nullif(btrim(p_customer_id), ''),
    nullif(btrim(p_event_id), '')
  )
  returning id into v_payment_id;

  update public.invoices
  set
    amount_paid = v_invoice.amount_paid + v_amount,
    amount_due = greatest(v_invoice.amount_due - v_amount, 0),
    status = 'paid',
    paid_at = v_paid_at,
    payment_provider = 'stripe',
    payment_provider_session_id = p_checkout_session_id,
    payment_link_url = coalesce(p_payment_url, v_invoice.payment_link_url),
    payment_status = 'paid',
    stripe_checkout_session_id = p_checkout_session_id,
    stripe_payment_intent_id = nullif(btrim(p_payment_intent_id), ''),
    stripe_customer_id = nullif(btrim(p_customer_id), ''),
    stripe_payment_url = coalesce(p_payment_url, v_invoice.stripe_payment_url),
    stripe_payment_status = 'paid',
    payment_amount_cents = p_amount_total::integer,
    payment_currency = lower(btrim(p_currency)),
    payment_error = null,
    updated_at = now()
  where id = p_invoice_id;

  insert into public.audit_events (
    actor_id,
    actor_email,
    actor_role,
    action,
    detail,
    entity_type,
    entity_id
  )
  values (
    v_invoice.client_id,
    coalesce(nullif(btrim(p_customer_email), ''), 'stripe-checkout'),
    'client',
    'invoice_payment_recorded',
    format(
      'Stripe Checkout payment %s on %s (receipt %s, session %s)',
      v_amount,
      v_invoice.invoice_number,
      v_receipt_number,
      p_checkout_session_id
    ),
    'invoice',
    p_invoice_id
  );

  return jsonb_build_object(
    'outcome', 'applied',
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_number,
    'invoice_status', 'paid'
  );
exception
  when unique_violation then
    select p.id, p.invoice_id
    into v_existing_payment_id, v_existing_invoice_id
    from public.payments p
    where p.provider_checkout_session_id = p_checkout_session_id
       or (
         nullif(btrim(p_payment_intent_id), '') is not null
         and p.provider_payment_id = p_payment_intent_id
       )
    limit 1;

    if found then
      if nullif(btrim(p_payment_intent_id), '') is not null then
        select p.id, p.invoice_id
        into v_intent_payment_id, v_intent_invoice_id
        from public.payments p
        where p.provider_payment_id = p_payment_intent_id
        limit 1;

        if found and (
          v_intent_payment_id is distinct from v_existing_payment_id
          or v_intent_invoice_id is distinct from v_existing_invoice_id
        ) then
          return jsonb_build_object('outcome', 'conflict');
        end if;
      end if;

      return jsonb_build_object(
        'outcome', case when v_existing_invoice_id = p_invoice_id then 'duplicate' else 'conflict' end,
        'payment_id', v_existing_payment_id
      );
    end if;

    if nullif(btrim(p_payment_intent_id), '') is not null then
      select p.id, p.invoice_id
      into v_existing_payment_id, v_existing_invoice_id
      from public.payments p
      where p.provider_payment_id = p_payment_intent_id
      limit 1;

      if found then
        return jsonb_build_object(
          'outcome', case when v_existing_invoice_id = p_invoice_id then 'duplicate' else 'conflict' end,
          'payment_id', v_existing_payment_id
        );
      end if;
    end if;

    return jsonb_build_object('outcome', 'conflict');
end;
$function$;

create or replace function public.update_stripe_invoice_event_status(
  p_invoice_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_status text,
  p_error text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_invoice public.invoices%rowtype;
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_checkout_session_id text := nullif(btrim(p_checkout_session_id), '');
  v_payment_intent_id text := nullif(btrim(p_payment_intent_id), '');
begin
  if v_status not in ('expired', 'unpaid', 'no_payment_required', 'failed', 'canceled')
    or (v_checkout_session_id is null) = (v_payment_intent_id is null)
  then
    return jsonb_build_object('outcome', 'invalid_input');
  end if;

  select i.*
  into v_invoice
  from public.invoices i
  where i.id = p_invoice_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if v_invoice.status not in ('sent', 'viewed', 'overdue', 'partially_paid')
    or v_invoice.payment_status in ('paid', 'requires_review', 'amount_mismatch', 'paid_requires_review')
    or v_invoice.stripe_payment_status in ('paid', 'requires_review', 'amount_mismatch', 'paid_requires_review')
  then
    return jsonb_build_object('outcome', 'ignored_terminal');
  end if;

  if v_checkout_session_id is not null then
    if v_status not in ('expired', 'unpaid', 'no_payment_required') then
      return jsonb_build_object('outcome', 'invalid_input');
    end if;

    if v_checkout_session_id is distinct from v_invoice.stripe_checkout_session_id
      and v_checkout_session_id is distinct from v_invoice.payment_provider_session_id
    then
      return jsonb_build_object('outcome', 'ignored_stale');
    end if;
  else
    if v_status not in ('failed', 'canceled') then
      return jsonb_build_object('outcome', 'invalid_input');
    end if;

    -- PaymentIntent events do not identify their Checkout Session. Only a
    -- previously associated current intent may alter status; Checkout events
    -- remain the authoritative success/payment-ledger path.
    if v_payment_intent_id is distinct from v_invoice.stripe_payment_intent_id then
      return jsonb_build_object('outcome', 'ignored_stale');
    end if;
  end if;

  update public.invoices
  set
    payment_status = case
      when v_status = 'no_payment_required' then 'requires_review'
      else v_status
    end,
    stripe_payment_status = v_status,
    payment_error = case
      when v_status = 'no_payment_required'
        then 'Stripe reported no payment required for an invoice with an amount due; manual review required.'
      when v_status = 'failed'
        then coalesce(nullif(btrim(p_error), ''), 'Payment failed')
      when v_status = 'canceled'
        then coalesce(nullif(btrim(p_error), ''), 'Payment canceled')
      else null
    end,
    updated_at = now()
  where id = p_invoice_id;

  return jsonb_build_object(
    'outcome', case when v_status = 'no_payment_required' then 'reconciliation_required' else 'applied' end,
    'status', v_status
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- RLS and table/storage privilege containment
-- ---------------------------------------------------------------------------

update storage.buckets
set public = false
where id in (
  'documents',
  'crew-credentials',
  'billing-documents',
  'communication-attachments',
  'network-application-files'
);

drop policy if exists "crew_cred_select" on storage.objects;
drop policy if exists "crew_cred_upload" on storage.objects;
drop policy if exists "documents_select" on storage.objects;
drop policy if exists "documents_upload" on storage.objects;
drop policy if exists "communication attachments admin read storage" on storage.objects;
drop policy if exists "communication attachments admin write storage" on storage.objects;
drop policy if exists "network application files admin read storage" on storage.objects;

drop policy if exists "Public can read access request status only" on public.access_request_status;
drop policy if exists "Admins can read access requests" on public.access_requests;
drop policy if exists "access_req_admin" on public.access_requests;
drop policy if exists "access_req_insert_anon" on public.access_requests;
drop policy if exists "access_requests_public_insert" on public.access_requests;
drop policy if exists "Allow public contact insert" on public.contact_form_submissions;

drop policy if exists role_permissions_admin_read on public.role_permissions;
create policy role_permissions_admin_read
on public.role_permissions
for select
to authenticated
using (public.is_approved_admin());

drop policy if exists crew_profiles_rw on public.crew_profiles;
drop policy if exists crew_profiles_select_self_or_admin on public.crew_profiles;
create policy crew_profiles_select_self_or_admin
on public.crew_profiles
for select
to authenticated
using (
  public.is_approved_admin()
  or (
    id = (select auth.uid())
    and public.is_approved_portal_user()
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'crew'
    )
  )
);

drop policy if exists presence_select_admin on public.crew_presence_sessions;
drop policy if exists presence_select_self on public.crew_presence_sessions;
create policy presence_select_admin
on public.crew_presence_sessions
for select
to authenticated
using (public.is_approved_admin());
create policy presence_select_self
on public.crew_presence_sessions
for select
to authenticated
using (
  crew_id = (select auth.uid())
  and public.is_approved_portal_user()
);

drop policy if exists airports_select on public.airports;
create policy airports_select
on public.airports
for select
to authenticated
using (public.is_approved_portal_user());

-- Profile self-read stays available so pending/suspended sessions can be routed
-- safely; approved active admins retain the reviewed directory read. All
-- profile writes continue through service-role paths.
drop policy if exists profiles_admin_all on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.is_approved_admin()
);

revoke all privileges on all tables in schema public from public, anon, authenticated;
revoke all privileges on all sequences in schema public from public, anon, authenticated;
grant select on table
  public.profiles,
  public.crew_profiles,
  public.crew_presence_sessions,
  public.airports
to authenticated;

-- Remove obsolete/broken remotely callable endpoints.
drop function if exists public.approve_access_request(uuid, text);
drop function if exists public.reject_access_request(uuid, text);
drop function if exists public.assign_crew_to_trip(uuid, uuid);
drop function if exists public.update_trip_status(uuid, text, text);
drop function if exists public.upsert_crew_availability(date, text, text);

-- Revoke every function first, then restore only the reviewed session surface.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_approved_portal_user() to authenticated;
grant execute on function public.is_approved_admin() to authenticated;
grant execute on function public.is_approved_super_admin() to authenticated;
grant execute on function public.rpc_crew_go_active(text, integer) to authenticated;
grant execute on function public.rpc_crew_go_offline() to authenticated;
grant execute on function public.rpc_map_admin() to authenticated;
grant execute on function public.rpc_map_crew() to authenticated;
grant execute on function public.rpc_map_client() to authenticated;
grant execute on function public.rpc_crew_map_admin_stats() to authenticated;
grant execute on function public.rpc_crew_map_crew_stats() to authenticated;
grant execute on function public.fn_crew_can_go_active(uuid) to authenticated;
grant execute on function public.fn_crew_go_active_blockers(uuid) to authenticated;

revoke all on function public.record_stripe_invoice_payment(
  uuid, text, text, text, text, bigint, text, timestamptz, text, text
) from public, anon, authenticated;
revoke all on function public.update_stripe_invoice_event_status(
  uuid, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.next_billing_document_number(text) to service_role;
grant execute on function public.record_stripe_invoice_payment(
  uuid, text, text, text, text, bigint, text, timestamptz, text, text
) to service_role;
grant execute on function public.update_stripe_invoice_event_status(
  uuid, text, text, text, text
) to service_role;

-- New objects must not silently re-open the Data API surface.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;

-- Migration self-test. The nested exception block rolls back only its fixtures.
do $verify$
declare
  v_invoice_id uuid;
  v_mismatch_invoice_id uuid;
  v_invalid_status_invoice_id uuid;
  v_status_invoice_id uuid;
  v_result jsonb;
  v_payment_id uuid;
begin
  -- An exception block is a PostgreSQL subtransaction. The sentinel exception
  -- at the end rolls back only the verification fixtures while preserving the
  -- migration itself; any real assertion failure still aborts the migration.
  begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ) then
    raise exception 'verification failed: anon can execute a SECURITY DEFINER function';
  end if;

  if exists (
    (
      select p.oid::regprocedure::text
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.prosecdef
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
      except
      select expected.signature
      from (values
        ('is_admin()'),
        ('is_approved_portal_user()'),
        ('is_approved_admin()'),
        ('is_approved_super_admin()'),
        ('rpc_crew_go_active(text,integer)'),
        ('rpc_crew_go_offline()'),
        ('rpc_map_admin()'),
        ('rpc_map_crew()'),
        ('rpc_map_client()'),
        ('rpc_crew_map_admin_stats()'),
        ('rpc_crew_map_crew_stats()'),
        ('fn_crew_can_go_active(uuid)'),
        ('fn_crew_go_active_blockers(uuid)')
      ) expected(signature)
    )
    union all
    (
      select expected.signature
      from (values
        ('is_admin()'),
        ('is_approved_portal_user()'),
        ('is_approved_admin()'),
        ('is_approved_super_admin()'),
        ('rpc_crew_go_active(text,integer)'),
        ('rpc_crew_go_offline()'),
        ('rpc_map_admin()'),
        ('rpc_map_crew()'),
        ('rpc_map_client()'),
        ('rpc_crew_map_admin_stats()'),
        ('rpc_crew_map_crew_stats()'),
        ('fn_crew_can_go_active(uuid)'),
        ('fn_crew_go_active_blockers(uuid)')
      ) expected(signature)
      except
      select p.oid::regprocedure::text
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.prosecdef
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
    )
  ) then
    raise exception 'verification failed: authenticated function allowlist mismatch';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.grantee = 'anon'
  ) then
    raise exception 'verification failed: anon retains a public table grant';
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and (
        has_table_privilege('anon', c.oid, 'SELECT')
        or has_table_privilege('anon', c.oid, 'INSERT')
        or has_table_privilege('anon', c.oid, 'UPDATE')
        or has_table_privilege('anon', c.oid, 'DELETE')
        or has_table_privilege('anon', c.oid, 'TRUNCATE')
        or has_table_privilege('anon', c.oid, 'REFERENCES')
        or has_table_privilege('anon', c.oid, 'TRIGGER')
      )
  ) then
    raise exception 'verification failed: anon retains effective table privilege';
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'S'
      and (
        has_sequence_privilege('anon', c.oid, 'USAGE')
        or has_sequence_privilege('anon', c.oid, 'SELECT')
        or has_sequence_privilege('anon', c.oid, 'UPDATE')
      )
  ) then
    raise exception 'verification failed: anon retains effective sequence privilege';
  end if;

  if exists (
    (
      select g.table_name, g.privilege_type
      from information_schema.role_table_grants g
      where g.table_schema = 'public' and g.grantee = 'authenticated'
      except
      select expected.table_name, 'SELECT'
      from (values
        ('profiles'),
        ('crew_profiles'),
        ('crew_presence_sessions'),
        ('airports')
      ) expected(table_name)
    )
    union all
    (
      select expected.table_name, 'SELECT'
      from (values
        ('profiles'),
        ('crew_profiles'),
        ('crew_presence_sessions'),
        ('airports')
      ) expected(table_name)
      except
      select g.table_name, g.privilege_type
      from information_schema.role_table_grants g
      where g.table_schema = 'public' and g.grantee = 'authenticated'
    )
  ) then
    raise exception 'verification failed: authenticated table allowlist mismatch';
  end if;

  if exists (
    select 1
    from pg_policies p
    where p.schemaname = 'storage'
      and p.tablename = 'objects'
      and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')) like '%bucket_id%'
      and (coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''))
        ~ $bucket$'(documents|crew-credentials|billing-documents|communication-attachments|network-application-files)'$bucket$
  ) then
    raise exception 'verification failed: sensitive storage policy remains';
  end if;

  if (
    select count(*)
    from storage.buckets b
    where b.id in (
      'documents',
      'crew-credentials',
      'billing-documents',
      'communication-attachments',
      'network-application-files'
    )
      and b.public is false
  ) <> 5 then
    raise exception 'verification failed: a sensitive storage bucket is missing or public';
  end if;

  if position(
    $needle$raw_user_meta_data->>'role'$needle$
    in replace(pg_get_functiondef('public.handle_new_user()'::regprocedure), ' ', '')
  ) > 0 then
    raise exception 'verification failed: auth trigger still reads metadata role';
  end if;

  if has_table_privilege('anon', 'public.profiles', 'UPDATE')
    or has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
  then
    raise exception 'verification failed: profile update privilege remains';
  end if;

  if (
    select count(*)
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'profiles'
      and p.policyname = 'profiles_select_self_or_admin'
      and p.cmd = 'SELECT'
      and p.roles = array['authenticated']::name[]
  ) <> 1 or (
    select count(*)
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = 'profiles'
  ) <> 1 then
    raise exception 'verification failed: profiles policy surface is not exact';
  end if;

  if has_function_privilege('authenticated', 'public.record_stripe_invoice_payment(uuid,text,text,text,text,bigint,text,timestamptz,text,text)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.record_stripe_invoice_payment(uuid,text,text,text,text,bigint,text,timestamptz,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.update_stripe_invoice_event_status(uuid,text,text,text,text)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.update_stripe_invoice_event_status(uuid,text,text,text,text)', 'EXECUTE')
    or not has_function_privilege('service_role', 'public.next_billing_document_number(text)', 'EXECUTE')
  then
    raise exception 'verification failed: billing RPC grants are wrong';
  end if;

  if not exists (
    select 1
    from pg_index i
    where i.indexrelid = 'public.payments_provider_checkout_session_id_uidx'::regclass
      and i.indrelid = 'public.payments'::regclass
      and i.indisunique
      and i.indpred is not null
  ) or not exists (
    select 1
    from pg_index i
    where i.indexrelid = 'public.payments_provider_payment_id_uidx'::regclass
      and i.indrelid = 'public.payments'::regclass
      and i.indisunique
      and i.indpred is not null
  ) then
    raise exception 'verification failed: Stripe idempotency indexes are missing';
  end if;

  insert into public.invoices (status, total, amount_paid, amount_due, currency)
  values ('sent', 12.34, 0, 12.34, 'USD')
  returning id into v_invoice_id;

  v_result := public.record_stripe_invoice_payment(
    v_invoice_id,
    'cs_test_security_remediation',
    'pi_test_security_remediation',
    null,
    'payer@example.test',
    1234,
    'usd',
    now(),
    'evt_test_security_remediation',
    'https://example.test/checkout'
  );

  if v_result ->> 'outcome' <> 'applied' then
    raise exception 'verification failed: Stripe payment was not applied: %', v_result;
  end if;
  v_payment_id := (v_result ->> 'payment_id')::uuid;

  v_result := public.record_stripe_invoice_payment(
    v_invoice_id,
    'cs_test_security_remediation',
    'pi_test_security_remediation',
    null,
    'payer@example.test',
    1234,
    'usd',
    now(),
    'evt_test_security_remediation',
    null
  );

  if v_result ->> 'outcome' <> 'duplicate'
    or (v_result ->> 'payment_id')::uuid <> v_payment_id
  then
    raise exception 'verification failed: Stripe idempotency failed: %', v_result;
  end if;

  if (select count(*) from public.payments p where p.invoice_id = v_invoice_id) <> 1
    or not exists (
      select 1
      from public.invoices i
      where i.id = v_invoice_id
        and i.status = 'paid'
        and i.amount_paid = 12.34
        and i.amount_due = 0
    )
  then
    raise exception 'verification failed: Stripe atomic state is inconsistent';
  end if;

  insert into public.invoices (status, total, amount_paid, amount_due, currency)
  values ('sent', 20, 0, 20, 'USD')
  returning id into v_mismatch_invoice_id;

  v_result := public.record_stripe_invoice_payment(
    v_mismatch_invoice_id,
    'cs_test_security_mismatch',
    null,
    null,
    null,
    1999,
    'usd',
    now(),
    'evt_test_security_mismatch',
    null
  );

  if v_result ->> 'outcome' <> 'reconciliation_required'
    or v_result ->> 'reason' <> 'amount_mismatch'
    or (select count(*) from public.payments p where p.invoice_id = v_mismatch_invoice_id) <> 1
    or not exists (
      select 1
      from public.payments p
      where p.invoice_id = v_mismatch_invoice_id
        and p.amount = 19.99
        and p.status = 'requires_review'
        and p.payment_status = 'paid_requires_review'
    )
    or not exists (
      select 1
      from public.invoices i
      where i.id = v_mismatch_invoice_id
        and i.status = 'sent'
        and i.amount_paid = 0
        and i.amount_due = 20
        and i.payment_status = 'requires_review'
        and i.stripe_payment_status = 'amount_mismatch'
    )
  then
    raise exception 'verification failed: Stripe mismatch handling failed: %', v_result;
  end if;

  v_result := public.record_stripe_invoice_payment(
    v_mismatch_invoice_id,
    'cs_test_security_mismatch',
    null,
    null,
    null,
    1999,
    'usd',
    now(),
    'evt_test_security_mismatch_retry',
    null
  );

  if v_result ->> 'outcome' <> 'duplicate'
    or (select count(*) from public.payments p where p.invoice_id = v_mismatch_invoice_id) <> 1
  then
    raise exception 'verification failed: Stripe mismatch idempotency failed: %', v_result;
  end if;

  insert into public.invoices (
    status,
    total,
    amount_paid,
    amount_due,
    currency,
    payment_status,
    stripe_payment_status,
    stripe_checkout_session_id,
    payment_provider_session_id
  )
  values ('sent', 10, 0, 10, 'USD', 'unpaid', 'unpaid', 'cs_status_current', 'cs_status_current')
  returning id into v_status_invoice_id;

  v_result := public.update_stripe_invoice_event_status(
    v_status_invoice_id,
    'cs_status_old',
    null,
    'expired',
    null
  );

  if v_result ->> 'outcome' <> 'ignored_stale'
    or (select payment_status from public.invoices where id = v_status_invoice_id) <> 'unpaid'
  then
    raise exception 'verification failed: stale Stripe session was not ignored: %', v_result;
  end if;

  v_result := public.update_stripe_invoice_event_status(
    v_status_invoice_id,
    'cs_status_current',
    null,
    'expired',
    null
  );

  if v_result ->> 'outcome' <> 'applied'
    or (select payment_status from public.invoices where id = v_status_invoice_id) <> 'expired'
  then
    raise exception 'verification failed: current Stripe session status was not applied: %', v_result;
  end if;

  v_result := public.update_stripe_invoice_event_status(
    v_invoice_id,
    'cs_test_security_remediation',
    null,
    'expired',
    null
  );

  if v_result ->> 'outcome' <> 'ignored_terminal'
    or (select status from public.invoices where id = v_invoice_id) <> 'paid'
    or (select payment_status from public.invoices where id = v_invoice_id) <> 'paid'
  then
    raise exception 'verification failed: late Stripe session overwrote paid invoice: %', v_result;
  end if;

  insert into public.invoices (status, total, amount_paid, amount_due, currency)
  values ('draft', 30, 0, 30, 'USD')
  returning id into v_invalid_status_invoice_id;

  v_result := public.record_stripe_invoice_payment(
    v_invalid_status_invoice_id,
    'cs_test_security_invalid_status',
    null,
    null,
    null,
    3000,
    'usd',
    now(),
    'evt_test_security_invalid_status',
    null
  );

  if v_result ->> 'outcome' <> 'reconciliation_required'
    or not exists (
      select 1
      from public.payments p
      where p.invoice_id = v_invalid_status_invoice_id
        and p.status = 'requires_review'
    )
    or not exists (
      select 1
      from public.invoices i
      where i.id = v_invalid_status_invoice_id
        and i.status = 'draft'
        and i.amount_paid = 0
        and i.amount_due = 30
        and i.payment_status = 'requires_review'
    )
  then
    raise exception 'verification failed: Stripe status guard failed: %', v_result;
  end if;
  raise sqlstate 'Z0001' using message = 'rollback security verification fixtures';
  exception
    when sqlstate 'Z0001' then null;
  end;
end;
$verify$;
