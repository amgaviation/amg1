create table if not exists public.contact_form_submissions (
  id uuid primary key default gen_random_uuid(),
  source_page text not null,
  submission_type text not null,
  inquiry_type text,
  support_path text,
  full_name text not null,
  email text not null,
  phone text not null,
  company_operator text,
  preferred_contact_method text,
  requester_role text,
  aircraft_category text,
  aircraft_type text,
  tail_number text,
  home_airport text,
  current_aircraft_location text,
  aircraft_status text,
  timeline_urgency text,
  owner_operator_approval_status text,
  message text,
  requested_support_summary text,
  conditional_details jsonb not null default '{}'::jsonb,
  raw_form jsonb not null default '{}'::jsonb,
  acknowledgement text not null,
  email_sent boolean not null default false,
  email_sent_at timestamptz,
  email_error text,
  status text not null default 'New',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_form_submissions_source_page_check
    check (source_page in ('Contact', 'Request Support')),
  constraint contact_form_submissions_submission_type_check
    check (submission_type in ('contact_inquiry', 'support_request')),
  constraint contact_form_submissions_status_check
    check (status in ('New', 'Reviewed', 'In Progress', 'Closed', 'Archived'))
);

create index if not exists contact_form_submissions_created_at_idx
  on public.contact_form_submissions (created_at desc);

create index if not exists contact_form_submissions_source_page_idx
  on public.contact_form_submissions (source_page);

create index if not exists contact_form_submissions_status_idx
  on public.contact_form_submissions (status);

create index if not exists contact_form_submissions_email_idx
  on public.contact_form_submissions (lower(email));

alter table public.contact_form_submissions enable row level security;

grant select, update on table public.contact_form_submissions to authenticated;
grant select, insert, update, delete on table public.contact_form_submissions to service_role;

drop policy if exists "Approved admins can view form submissions" on public.contact_form_submissions;
create policy "Approved admins can view form submissions"
  on public.contact_form_submissions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.status = 'approved'
    )
  );

drop policy if exists "Approved admins can update form submissions" on public.contact_form_submissions;
create policy "Approved admins can update form submissions"
  on public.contact_form_submissions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.status = 'approved'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.status = 'approved'
    )
  );
