-- AMG Connect operational portal data model draft.
-- Target database: Postgres.
-- This schema is implementation-oriented documentation, not yet wired to runtime code.

create type portal_role as enum ('client', 'crew', 'admin', 'partner');
create type support_stage as enum (
  'draft',
  'submitted',
  'intake_review',
  'crew_review',
  'partner_pending',
  'owner_approval',
  'scheduled',
  'active',
  'completed',
  'cancelled',
  'closed'
);
create type approval_status as enum ('requested', 'approved', 'rejected', 'expired', 'overridden');
create type document_visibility as enum ('owner', 'crew', 'partner', 'admin', 'assigned_only');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('owner', 'family_office', 'amg', 'crew_group', 'partner')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text,
  status text not null default 'pending',
  mfa_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id),
  organization_id uuid not null references organizations(id),
  role portal_role not null,
  title text,
  status text not null default 'pending',
  approved_by uuid references accounts(id),
  approved_at timestamptz,
  expires_at timestamptz,
  unique (account_id, organization_id, role)
);

create table permission_overrides (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id),
  module text not null,
  permission text not null,
  scope_type text not null,
  scope_id uuid,
  reason text not null,
  granted_by uuid not null references accounts(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table aircraft (
  id uuid primary key default gen_random_uuid(),
  tail_number text not null unique,
  manufacturer text,
  model text,
  category text,
  home_base text,
  readiness_status text not null default 'unknown',
  owner_organization_id uuid references organizations(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table aircraft_access (
  id uuid primary key default gen_random_uuid(),
  aircraft_id uuid not null references aircraft(id),
  account_id uuid references accounts(id),
  organization_id uuid references organizations(id),
  role portal_role not null,
  visibility_scope text not null default 'standard',
  created_at timestamptz not null default now(),
  check (account_id is not null or organization_id is not null)
);

create table passenger_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_organization_id uuid not null references organizations(id),
  display_name text not null,
  notes text,
  preferences jsonb not null default '{}',
  sensitivity_level text not null default 'standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table crew_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id),
  status text not null default 'pending_review',
  home_base text,
  availability_status text not null default 'unknown',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table crew_qualifications (
  id uuid primary key default gen_random_uuid(),
  crew_profile_id uuid not null references crew_profiles(id),
  aircraft_type text not null,
  qualification_kind text not null,
  recent_experience text,
  verified_by uuid references accounts(id),
  verified_at timestamptz,
  expires_at timestamptz
);

create table partner_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  service_category text not null,
  service_area text,
  status text not null default 'pending_review',
  primary_contact_id uuid references accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table support_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  requester_account_id uuid not null references accounts(id),
  owner_organization_id uuid references organizations(id),
  aircraft_id uuid references aircraft(id),
  support_type text not null,
  stage support_stage not null default 'submitted',
  origin text,
  destination text,
  requested_start_at timestamptz,
  requested_end_at timestamptz,
  passenger_context_required boolean not null default false,
  crew_required boolean not null default false,
  priority text not null default 'standard',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table support_request_passengers (
  support_request_id uuid not null references support_requests(id),
  passenger_profile_id uuid not null references passenger_profiles(id),
  role text not null default 'passenger',
  primary key (support_request_id, passenger_profile_id)
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references support_requests(id),
  account_id uuid references accounts(id),
  partner_profile_id uuid references partner_profiles(id),
  assignment_type text not null,
  status text not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (account_id is not null or partner_profile_id is not null)
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references support_requests(id),
  requested_from_account_id uuid references accounts(id),
  requested_from_role portal_role,
  approval_type text not null,
  status approval_status not null default 'requested',
  reason text,
  decided_by uuid references accounts(id),
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document_type text not null,
  storage_key text not null,
  checksum text,
  uploaded_by uuid not null references accounts(id),
  organization_id uuid references organizations(id),
  aircraft_id uuid references aircraft(id),
  support_request_id uuid references support_requests(id),
  visibility document_visibility not null,
  status text not null default 'active',
  version integer not null default 1,
  retained_until timestamptz,
  created_at timestamptz not null default now()
);

create table message_threads (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid references support_requests(id),
  subject text not null,
  visibility_scope text not null,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references message_threads(id),
  sender_account_id uuid not null references accounts(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table finance_packets (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references support_requests(id),
  status text not null default 'draft',
  owner_visible boolean not null default false,
  subtotal_cents integer not null default 0,
  currency text not null default 'USD',
  released_by uuid references accounts(id),
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_account_id uuid references accounts(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  request_reference text,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index support_requests_stage_idx on support_requests(stage);
create index support_requests_aircraft_idx on support_requests(aircraft_id);
create index assignments_support_request_idx on assignments(support_request_id);
create index documents_support_request_idx on documents(support_request_id);
create index audit_events_entity_idx on audit_events(entity_type, entity_id);
create index audit_events_actor_idx on audit_events(actor_account_id, created_at desc);

-- Public service inquiries are anonymous website qualification records.
-- They are not operational missions and should be converted only after AMG review.
create table service_inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new',
  service_type text not null,
  assigned_team text not null,
  source text,
  requester_name text not null,
  email text not null,
  phone text,
  organization text,
  urgency text not null default 'standard',
  aircraft_identifier text,
  origin text,
  destination text,
  requested_date date,
  timeframe text,
  summary text,
  service_details jsonb not null default '{}',
  context jsonb not null default '{}',
  idempotency_key text not null unique,
  payload_hash text,
  converted_mission_id uuid references missions(id),
  constraint service_inquiries_status_check check (status in ('new', 'reviewing', 'contacted', 'qualified', 'converted', 'closed')),
  constraint service_inquiries_service_type_check check (service_type in ('aircraft-management', 'contract-crew', 'ferry-repositioning', 'maintenance-flight', 'operations-coordination', 'fleet-support', 'general')),
  constraint service_inquiries_assigned_team_check check (assigned_team in ('management', 'operations', 'general')),
  constraint service_inquiries_urgency_check check (urgency in ('standard', 'urgent', 'aog'))
);

create index service_inquiries_created_at_idx on service_inquiries(created_at desc);
create index service_inquiries_status_idx on service_inquiries(status);
create index service_inquiries_service_type_idx on service_inquiries(service_type);
create index service_inquiries_assigned_team_idx on service_inquiries(assigned_team);
create index service_inquiries_email_lower_idx on service_inquiries(lower(email));
create index service_inquiries_converted_mission_id_idx on service_inquiries(converted_mission_id);
