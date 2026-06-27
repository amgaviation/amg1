alter table public.public_support_requests
  add column if not exists source_submission_id uuid references public.contact_form_submissions(id) on delete set null,
  add column if not exists source_form_type text not null default 'support_request',
  add column if not exists assigned_admin_id uuid references public.profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;

create unique index if not exists public_support_requests_source_submission_id_idx
  on public.public_support_requests (source_submission_id)
  where source_submission_id is not null;

create index if not exists public_support_requests_source_form_type_idx
  on public.public_support_requests (source_form_type);

create index if not exists public_support_requests_archived_at_idx
  on public.public_support_requests (archived_at);

create or replace function public.set_public_support_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_public_support_requests_updated_at on public.public_support_requests;
create trigger set_public_support_requests_updated_at
before update on public.public_support_requests
for each row
execute function public.set_public_support_requests_updated_at();

with support_submission_candidates as (
  select
    cfs.*,
    gen_random_uuid() as generated_mission_id,
    coalesce(
      nullif(cfs.support_type, ''),
      nullif(cfs.support_path, ''),
      nullif(cfs.service_interest, ''),
      'Aircraft Support'
    ) as requested_category
  from public.contact_form_submissions cfs
  where cfs.submission_type = 'support_request'
    and not exists (
      select 1
      from public.public_support_requests psr
      where psr.source_submission_id = cfs.id
    )
    and not exists (
      select 1
      from public.public_support_requests psr
      where lower(psr.email) = lower(cfs.email)
        and psr.requested_service_category = coalesce(
          nullif(cfs.support_type, ''),
          nullif(cfs.support_path, ''),
          nullif(cfs.service_interest, ''),
          'Aircraft Support'
        )
        and psr.created_at between cfs.created_at - interval '5 minutes'
          and cfs.created_at + interval '5 minutes'
    )
),
inserted_missions as (
  insert into public.missions (
    id,
    client_id,
    aircraft_id,
    tail_number,
    mission_type,
    status,
    urgency,
    departure_airport,
    arrival_airport,
    requested_departure,
    passenger_count,
    additional_notes,
    client_notes,
    created_at,
    updated_at
  )
  select
    generated_mission_id,
    null,
    null,
    nullif(upper(regexp_replace(coalesce(tail_number, ''), '\s+', '', 'g')), ''),
    case
      when lower(requested_category) like '%maintenance%' then 'maintenance_reposition'
      when lower(requested_category) like '%ferry%' or lower(requested_category) like '%reposition%' then 'ferry'
      when lower(requested_category) like '%pilot%' or lower(requested_category) like '%crew%' then 'crew_reposition'
      else 'aircraft_support'
    end,
    'submitted',
    case
      when lower(coalesce(timing, timeline_urgency, '')) like '%aog%'
        or lower(coalesce(timing, timeline_urgency, '')) like '%urgent%'
        or lower(coalesce(timing, timeline_urgency, '')) like '%same-day%'
        or lower(coalesce(timing, timeline_urgency, '')) like '%48 hour%' then 'aog'
      when lower(coalesce(timing, timeline_urgency, '')) like '%this week%'
        or lower(coalesce(timing, timeline_urgency, '')) like '%priority%' then 'priority'
      else 'standard'
    end,
    coalesce(nullif(upper(departure_airport), ''), 'TBD'),
    coalesce(nullif(upper(arrival_airport), ''), 'TBD'),
    case
      when requested_date ~ '^\d{4}-\d{2}-\d{2}$' then (
        requested_date || ' ' ||
        case
          when requested_time ~ '^\d{2}:\d{2}$' then requested_time
          else '00:00'
        end
      )::timestamptz
      else null
    end,
    0,
    coalesce(nullif(message, ''), nullif(requested_support_summary, '')),
    concat_ws(
      E'\n',
      'Requester: ' || coalesce(nullif(requester_name, ''), nullif(full_name, ''), email),
      'Email: ' || email,
      case when nullif(phone, '') is not null then 'Phone: ' || phone end,
      case when coalesce(nullif(company, ''), nullif(organization, ''), nullif(company_operator, '')) is not null
        then 'Organization: ' || coalesce(nullif(company, ''), nullif(organization, ''), nullif(company_operator, ''))
      end,
      'Source form submission: ' || id::text
    ),
    created_at,
    created_at
  from support_submission_candidates
  returning id
)
insert into public.public_support_requests (
  mission_id,
  client_id,
  first_name,
  last_name,
  requester_name,
  email,
  phone,
  preferred_contact_method,
  company_name,
  requested_service_category,
  aircraft_make,
  aircraft_model,
  aircraft_display,
  tail_number,
  aircraft_base,
  requested_timing,
  route,
  departure_airport,
  arrival_airport,
  operational_summary,
  category_details,
  raw_form,
  source_form_type,
  source_submission_id,
  created_at,
  updated_at
)
select
  c.generated_mission_id,
  null,
  c.first_name,
  c.last_name,
  coalesce(nullif(c.requester_name, ''), nullif(c.full_name, ''), c.email),
  c.email,
  nullif(c.phone, ''),
  c.preferred_contact_method,
  coalesce(nullif(c.company, ''), nullif(c.organization, ''), nullif(c.company_operator, '')),
  c.requested_category,
  null,
  null,
  coalesce(nullif(c.aircraft, ''), nullif(c.aircraft_type, ''), nullif(c.aircraft_category, '')),
  nullif(upper(regexp_replace(coalesce(c.tail_number, ''), '\s+', '', 'g')), ''),
  nullif(upper(c.home_airport), ''),
  coalesce(nullif(c.timing, ''), nullif(c.timeline_urgency, '')),
  c.route,
  nullif(upper(c.departure_airport), ''),
  nullif(upper(c.arrival_airport), ''),
  coalesce(nullif(c.message, ''), nullif(c.requested_support_summary, '')),
  coalesce(c.payload, c.raw_form, '{}'::jsonb),
  coalesce(c.raw_form, c.payload, '{}'::jsonb),
  'support_request',
  c.id,
  c.created_at,
  c.created_at
from support_submission_candidates c
join inserted_missions m on m.id = c.generated_mission_id
on conflict do nothing;

alter table public.public_support_requests enable row level security;

revoke all on table public.public_support_requests from anon;
grant select, update on table public.public_support_requests to authenticated;
grant select, insert, update, delete on table public.public_support_requests to service_role;

drop policy if exists "Admins manage public support requests" on public.public_support_requests;
create policy "Admins manage public support requests"
  on public.public_support_requests
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
        and p.status = 'approved'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
        and p.status = 'approved'
    )
  );

drop policy if exists "Clients read own public support requests" on public.public_support_requests;
create policy "Clients read own public support requests"
  on public.public_support_requests
  for select
  to authenticated
  using (
    client_id = (select auth.uid())
    or portal_account_user_id = (select auth.uid())
  );

select pg_notify('pgrst', 'reload schema');
