-- AMG operational communications center. Additive V1 schema only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'communication-attachments',
  'communication-attachments',
  false,
  26214400,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.communication_threads (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,
  subject text,
  status text not null default 'needs_review',
  priority text not null default 'normal',
  channel text not null default 'email',
  assigned_to_user_id uuid references public.profiles(id) on delete set null,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  related_client_id uuid references public.profiles(id) on delete set null,
  related_aircraft_id uuid references public.aircraft(id) on delete set null,
  related_request_id uuid references public.missions(id) on delete set null,
  related_quote_id uuid references public.quotes(id) on delete set null,
  related_invoice_id uuid references public.invoices(id) on delete set null,
  related_crew_assignment_id uuid references public.mission_crew_assignments(id) on delete set null,
  last_message_at timestamptz,
  unread_count integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint communication_threads_status_check check (status in (
    'new',
    'needs_review',
    'action_required',
    'waiting_on_client',
    'waiting_on_crew',
    'waiting_on_owner_operator',
    'waiting_on_vendor',
    'waiting_on_billing',
    'resolved',
    'closed',
    'archived'
  )),
  constraint communication_threads_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint communication_threads_channel_check check (channel in ('email', 'portal_message', 'phone', 'system'))
);

create table if not exists public.communication_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.communication_threads(id) on delete cascade,
  public_id text unique not null,
  message_type text not null,
  direction text not null,
  visibility text not null default 'internal',
  status text not null default 'received',
  provider text,
  provider_message_id text,
  provider_thread_id text,
  inbound_webhook_event_id text,
  in_reply_to text,
  references_header text,
  from_email text,
  from_name text,
  to_emails text[] not null default '{}',
  cc_emails text[] not null default '{}',
  bcc_emails text[] not null default '{}',
  reply_to_email text,
  subject text,
  body_html text,
  body_text text,
  raw_headers jsonb,
  raw_payload jsonb,
  sent_by_user_id uuid references public.profiles(id) on delete set null,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  received_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  constraint communication_messages_message_type_check check (message_type in ('email', 'portal_message', 'internal_note', 'system_event')),
  constraint communication_messages_direction_check check (direction in ('inbound', 'outbound', 'internal', 'system')),
  constraint communication_messages_visibility_check check (visibility in ('internal', 'client_visible', 'crew_visible', 'admin_only')),
  constraint communication_messages_status_check check (status in ('draft', 'queued', 'sent', 'delivered', 'received', 'failed', 'bounced', 'archived'))
);

create table if not exists public.communication_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.communication_threads(id) on delete cascade,
  participant_type text not null,
  user_id uuid references public.profiles(id) on delete set null,
  contact_id uuid,
  client_id uuid references public.profiles(id) on delete set null,
  crew_id uuid references public.profiles(id) on delete set null,
  email text,
  name text,
  role_label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint communication_participants_type_check check (participant_type in ('admin', 'client', 'crew', 'owner_operator', 'vendor', 'unknown'))
);

create table if not exists public.communication_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.communication_messages(id) on delete cascade,
  thread_id uuid not null references public.communication_threads(id) on delete cascade,
  file_name text not null,
  content_type text,
  file_size_bytes bigint,
  storage_bucket text not null,
  storage_path text not null,
  source text not null,
  uploaded_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint communication_attachments_source_check check (source in ('inbound_email', 'outbound_email', 'portal_upload', 'generated_pdf'))
);

create table if not exists public.communication_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  subject_template text not null,
  body_template_html text,
  body_template_text text,
  allowed_roles text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communication_templates_category_check check (category in (
    'support_request',
    'crew_coordination',
    'billing',
    'documents',
    'maintenance',
    'general',
    'status_update'
  ))
);

create table if not exists public.communication_audit_log (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.communication_threads(id) on delete set null,
  message_id uuid references public.communication_messages(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.communication_user_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  thread_id uuid not null references public.communication_threads(id) on delete cascade,
  last_read_at timestamptz,
  muted boolean not null default false,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, thread_id)
);

create index if not exists communication_threads_last_message_at_idx
  on public.communication_threads (last_message_at desc nulls last);
create index if not exists communication_threads_status_idx
  on public.communication_threads (status);
create index if not exists communication_threads_assigned_to_user_id_idx
  on public.communication_threads (assigned_to_user_id);
create index if not exists communication_threads_related_client_id_idx
  on public.communication_threads (related_client_id);
create index if not exists communication_threads_related_aircraft_id_idx
  on public.communication_threads (related_aircraft_id);
create index if not exists communication_threads_related_request_id_idx
  on public.communication_threads (related_request_id);
create index if not exists communication_threads_related_quote_id_idx
  on public.communication_threads (related_quote_id);
create index if not exists communication_threads_related_invoice_id_idx
  on public.communication_threads (related_invoice_id);
create index if not exists communication_messages_thread_created_at_idx
  on public.communication_messages (thread_id, created_at);
create index if not exists communication_messages_provider_message_id_idx
  on public.communication_messages (provider_message_id);
create index if not exists communication_messages_inbound_webhook_event_id_idx
  on public.communication_messages (inbound_webhook_event_id);
create index if not exists communication_messages_from_email_idx
  on public.communication_messages (lower(from_email));
create index if not exists communication_participants_thread_id_idx
  on public.communication_participants (thread_id);
create index if not exists communication_attachments_thread_id_idx
  on public.communication_attachments (thread_id);
create index if not exists communication_user_state_user_thread_idx
  on public.communication_user_state (user_id, thread_id);

alter table public.communication_threads enable row level security;
alter table public.communication_messages enable row level security;
alter table public.communication_participants enable row level security;
alter table public.communication_attachments enable row level security;
alter table public.communication_templates enable row level security;
alter table public.communication_audit_log enable row level security;
alter table public.communication_user_state enable row level security;

drop policy if exists "communication admin all threads" on public.communication_threads;
create policy "communication admin all threads"
on public.communication_threads
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));

drop policy if exists "communication client visible threads" on public.communication_threads;
create policy "communication client visible threads"
on public.communication_threads
for select
to authenticated
using (related_client_id = auth.uid());

drop policy if exists "communication crew visible threads" on public.communication_threads;
create policy "communication crew visible threads"
on public.communication_threads
for select
to authenticated
using (
  exists (
    select 1
    from public.mission_crew_assignments mca
    where mca.id = related_crew_assignment_id
      and mca.crew_id = auth.uid()
  )
);

drop policy if exists "communication admin all messages" on public.communication_messages;
create policy "communication admin all messages"
on public.communication_messages
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));

drop policy if exists "communication client visible messages" on public.communication_messages;
create policy "communication client visible messages"
on public.communication_messages
for select
to authenticated
using (
  visibility = 'client_visible'
  and exists (
    select 1
    from public.communication_threads ct
    where ct.id = communication_messages.thread_id
      and ct.related_client_id = auth.uid()
  )
);

drop policy if exists "communication crew visible messages" on public.communication_messages;
create policy "communication crew visible messages"
on public.communication_messages
for select
to authenticated
using (
  visibility = 'crew_visible'
  and exists (
    select 1
    from public.communication_threads ct
    join public.mission_crew_assignments mca on mca.id = ct.related_crew_assignment_id
    where ct.id = communication_messages.thread_id
      and mca.crew_id = auth.uid()
  )
);

drop policy if exists "communication admin all participants" on public.communication_participants;
create policy "communication admin all participants"
on public.communication_participants
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));

drop policy if exists "communication admin all attachments" on public.communication_attachments;
create policy "communication admin all attachments"
on public.communication_attachments
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));

drop policy if exists "communication admin all templates" on public.communication_templates;
create policy "communication admin all templates"
on public.communication_templates
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));

drop policy if exists "communication admin all audit" on public.communication_audit_log;
create policy "communication admin all audit"
on public.communication_audit_log
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));

drop policy if exists "communication admin own state" on public.communication_user_state;
create policy "communication admin own state"
on public.communication_user_state
for all
to authenticated
using (
  user_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved')
)
with check (
  user_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved')
);

drop policy if exists "communication attachments admin read storage" on storage.objects;
create policy "communication attachments admin read storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'communication-attachments'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved')
);

drop policy if exists "communication attachments admin write storage" on storage.objects;
create policy "communication attachments admin write storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'communication-attachments'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved')
);

grant select, insert, update, delete on
  public.communication_threads,
  public.communication_messages,
  public.communication_participants,
  public.communication_attachments,
  public.communication_templates,
  public.communication_audit_log,
  public.communication_user_state
to authenticated;

insert into public.communication_templates (name, category, subject_template, body_template_text, body_template_html, allowed_roles)
values
  (
    'Support Request Received',
    'support_request',
    'AMG Support Request Received — Under Review',
    'Thank you for submitting your request. AMG is reviewing the support scope, aircraft status, crew availability, owner/operator approval requirements, and operating conditions before the request is presented as accepted.',
    '<p>Thank you for submitting your request. AMG is reviewing the support scope, aircraft status, crew availability, owner/operator approval requirements, and operating conditions before the request is presented as accepted.</p>',
    array['admin']
  ),
  (
    'Additional Information Needed',
    'support_request',
    'Additional Information Needed — AMG Support Review',
    'AMG needs additional information before continuing operational review. Please reply with the requested details so the support scope, aircraft status, crew availability, owner/operator approval requirements, and operating conditions can be reviewed.',
    '<p>AMG needs additional information before continuing operational review. Please reply with the requested details so the support scope, aircraft status, crew availability, owner/operator approval requirements, and operating conditions can be reviewed.</p>',
    array['admin']
  ),
  (
    'Support Request Status Update',
    'status_update',
    'AMG Support Request Update',
    'AMG is providing a status update on your support request. No request is considered accepted until applicable operational, aircraft, crew, approval, and condition items have been reviewed.',
    '<p>AMG is providing a status update on your support request.</p><p>No request is considered accepted until applicable operational, aircraft, crew, approval, and condition items have been reviewed.</p>',
    array['admin']
  ),
  (
    'Crew Availability Request',
    'crew_coordination',
    'Crew Availability Request — AMG Aviation Group',
    'AMG is reviewing crew availability for an operational support request. Please reply with your availability and any constraints for the requested timing.',
    '<p>AMG is reviewing crew availability for an operational support request. Please reply with your availability and any constraints for the requested timing.</p>',
    array['admin']
  ),
  (
    'Crew Assignment Confirmation',
    'crew_coordination',
    'Crew Assignment Update — AMG Aviation Group',
    'AMG is providing an update regarding a crew assignment. Please review the operational details and reply with any questions or constraints.',
    '<p>AMG is providing an update regarding a crew assignment. Please review the operational details and reply with any questions or constraints.</p>',
    array['admin']
  ),
  (
    'Quote Ready',
    'billing',
    'AMG Quote Ready for Review',
    'An AMG quote is ready for review. Please review the quote details and reply with any questions before approval or payment steps proceed.',
    '<p>An AMG quote is ready for review. Please review the quote details and reply with any questions before approval or payment steps proceed.</p>',
    array['admin']
  ),
  (
    'Invoice Sent',
    'billing',
    'AMG Invoice',
    'AMG has sent an invoice for review. Please reply with any billing questions or corrections.',
    '<p>AMG has sent an invoice for review. Please reply with any billing questions or corrections.</p>',
    array['admin']
  ),
  (
    'Payment Received',
    'billing',
    'Payment Received — AMG Aviation Group',
    'AMG has received payment. Thank you.',
    '<p>AMG has received payment. Thank you.</p>',
    array['admin']
  ),
  (
    'Document Request',
    'documents',
    'Documents Needed — AMG Aviation Group',
    'AMG needs documents to continue operational review. Please provide the requested document(s) through the secure portal or reply with questions.',
    '<p>AMG needs documents to continue operational review. Please provide the requested document(s) through the secure portal or reply with questions.</p>',
    array['admin']
  ),
  (
    'Maintenance Coordination',
    'maintenance',
    'Maintenance Support Coordination — AMG Aviation Group',
    'AMG is coordinating maintenance support details. Please review the current information and reply with availability, constraints, or required next steps.',
    '<p>AMG is coordinating maintenance support details. Please review the current information and reply with availability, constraints, or required next steps.</p>',
    array['admin']
  )
on conflict (name) do update
set category = excluded.category,
    subject_template = excluded.subject_template,
    body_template_text = excluded.body_template_text,
    body_template_html = excluded.body_template_html,
    allowed_roles = excluded.allowed_roles,
    active = true,
    updated_at = now();
