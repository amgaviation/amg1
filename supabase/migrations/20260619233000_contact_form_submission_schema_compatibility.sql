alter table public.contact_form_submissions
  add column if not exists source_page text,
  add column if not exists submission_type text,
  add column if not exists requester_name text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists company text,
  add column if not exists organization text,
  add column if not exists company_operator text,
  add column if not exists preferred_contact_method text,
  add column if not exists requester_role text,
  add column if not exists aircraft text,
  add column if not exists aircraft_category text,
  add column if not exists aircraft_type text,
  add column if not exists aircraft_status text,
  add column if not exists tail_number text,
  add column if not exists route text,
  add column if not exists departure_airport text,
  add column if not exists arrival_airport text,
  add column if not exists timing text,
  add column if not exists requested_date text,
  add column if not exists requested_time text,
  add column if not exists support_type text,
  add column if not exists support_path text,
  add column if not exists service_interest text,
  add column if not exists inquiry_type text,
  add column if not exists crew_need text,
  add column if not exists passenger_context text,
  add column if not exists home_airport text,
  add column if not exists current_aircraft_location text,
  add column if not exists timeline_urgency text,
  add column if not exists owner_operator_approval_status text,
  add column if not exists message text,
  add column if not exists requested_support_summary text,
  add column if not exists acknowledgement text,
  add column if not exists marketing_consent boolean,
  add column if not exists conditional_details jsonb not null default '{}'::jsonb,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists raw_form jsonb not null default '{}'::jsonb,
  add column if not exists source_url text,
  add column if not exists referrer text,
  add column if not exists user_agent text,
  add column if not exists email_sent boolean not null default false,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_error text,
  add column if not exists internal_email_sent boolean not null default false,
  add column if not exists internal_email_sent_at timestamptz,
  add column if not exists confirmation_email_sent boolean not null default false,
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists status text not null default 'new',
  add column if not exists admin_notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.contact_form_submissions
  drop constraint if exists contact_form_submissions_status_check;

alter table public.contact_form_submissions
  drop constraint if exists contact_form_submissions_source_page_check;

alter table public.contact_form_submissions
  drop constraint if exists contact_form_submissions_submission_type_check;

update public.contact_form_submissions
set
  requester_name = coalesce(requester_name, full_name),
  full_name = coalesce(full_name, requester_name),
  company = coalesce(company, company_operator),
  organization = coalesce(organization, company_operator),
  aircraft = coalesce(aircraft, aircraft_type),
  timing = coalesce(timing, timeline_urgency),
  support_type = coalesce(support_type, support_path),
  service_interest = coalesce(service_interest, inquiry_type, support_path),
  payload = case
    when payload = '{}'::jsonb then coalesce(raw_form, '{}'::jsonb)
    else payload
  end,
  raw_form = case
    when raw_form = '{}'::jsonb then coalesce(payload, '{}'::jsonb)
    else raw_form
  end,
  status = case
    when status = 'New' then 'new'
    when status = 'Reviewed' then 'reviewed'
    when status = 'In Progress' then 'in_progress'
    when status = 'Closed' then 'closed'
    when status = 'Archived' then 'archived'
    else coalesce(status, 'new')
  end;

alter table public.contact_form_submissions
  alter column status set default 'new',
  alter column payload set default '{}'::jsonb,
  alter column payload set not null,
  alter column raw_form set default '{}'::jsonb,
  alter column raw_form set not null,
  alter column conditional_details set default '{}'::jsonb,
  alter column conditional_details set not null;

alter table public.contact_form_submissions
  add constraint contact_form_submissions_status_check
  check (status in ('new', 'reviewed', 'in_progress', 'closed', 'archived'));

alter table public.contact_form_submissions
  add constraint contact_form_submissions_source_page_check
  check (source_page in ('Contact', 'Request Support'));

alter table public.contact_form_submissions
  add constraint contact_form_submissions_submission_type_check
  check (submission_type in ('contact_inquiry', 'support_request'));

create or replace function public.set_contact_form_submissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_contact_form_submissions_updated_at on public.contact_form_submissions;
create trigger set_contact_form_submissions_updated_at
before update on public.contact_form_submissions
for each row
execute function public.set_contact_form_submissions_updated_at();

create index if not exists contact_form_submissions_created_at_idx
  on public.contact_form_submissions (created_at desc);

create index if not exists contact_form_submissions_email_idx
  on public.contact_form_submissions (lower(email));

create index if not exists contact_form_submissions_status_idx
  on public.contact_form_submissions (status);

create index if not exists contact_form_submissions_submission_type_idx
  on public.contact_form_submissions (submission_type);

create index if not exists contact_form_submissions_source_page_idx
  on public.contact_form_submissions (source_page);

alter table public.contact_form_submissions enable row level security;

grant select, update on table public.contact_form_submissions to authenticated;
grant select, insert, update, delete on table public.contact_form_submissions to service_role;

select pg_notify('pgrst', 'reload schema');
