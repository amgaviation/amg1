-- Crew email template metadata and starter templates for admin crew communications.

alter table public.communication_templates
  add column if not exists template_key text,
  add column if not exists variables jsonb not null default '[]'::jsonb;

create unique index if not exists communication_templates_template_key_idx
  on public.communication_templates (template_key)
  where template_key is not null;

insert into public.communication_templates (
  template_key,
  name,
  category,
  subject_template,
  body_template_text,
  body_template_html,
  allowed_roles,
  variables,
  active
)
values
  (
    'crew_network_acceptance',
    'Crew Network Acceptance',
    'crew_coordination',
    'Accepted into the AMG Crew Network',
    'Hello {{crew_first_name}},

AMG has accepted you into the AMG Crew Network.

This means AMG may contact you for mission opportunities when your qualifications, aircraft experience, location, availability, and operational fit align with a request. Mission contact is based on operational need and does not guarantee an assignment.

Please keep your AMG portal profile, aircraft experience, credentials, contact details, and availability current.

AMG Operations
{{amg_operations_email}}',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","portal_link","amg_operations_email","home_airport"]'::jsonb,
    true
  ),
  (
    'account_suspension',
    'Account Suspension',
    'status_update',
    'AMG Crew Network account status',
    'Hello {{crew_first_name}},

Your AMG portal or crew network account has been suspended or placed on hold pending review.

During this review period, AMG may pause mission outreach, credential review, portal access, or network activity connected to your profile. AMG Operations will contact you if more information is needed.

If you believe this status is incorrect, reply to this message or contact AMG Operations at {{amg_operations_email}}.

AMG Operations',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","portal_link","amg_operations_email"]'::jsonb,
    true
  ),
  (
    'mission_request',
    'Mission Request',
    'crew_coordination',
    'Availability request: {{mission_id}}',
    'Hello {{crew_first_name}},

AMG is checking your availability and interest for a potential mission.

Mission: {{mission_id}}
Date: {{mission_date}}
Route: {{departure_airport}} to {{arrival_airport}}
Aircraft: {{aircraft_type}}
Tail: {{tail_number}}

Please reply with your availability, any duty or travel constraints, and relevant aircraft-specific notes. This message is an availability request only; the mission is not assigned or confirmed until AMG Operations completes review and issues a separate confirmation.

AMG Operations
{{amg_operations_email}}',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","portal_link","amg_operations_email","mission_id","mission_date","departure_airport","arrival_airport","aircraft_type","tail_number"]'::jsonb,
    true
  ),
  (
    'document_request',
    'Document Request',
    'documents',
    'Documents needed for AMG crew review',
    'Hello {{crew_first_name}},

AMG needs updated or missing crew documents before continuing review.

Requested documents:
{{requested_documents}}

Please upload the requested files through the AMG portal or reply with any questions. Portal link: {{portal_link}}

AMG Operations',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","portal_link","amg_operations_email","requested_documents"]'::jsonb,
    true
  ),
  (
    'logbook_request',
    'Logbook Request',
    'documents',
    'Logbook details requested',
    'Hello {{crew_first_name}},

AMG needs logbook details or experience verification for crew review.

Please provide the relevant logbook pages, time summaries, recency details, aircraft-specific experience, or type-specific totals. If the request relates to a mission, include any context for {{aircraft_type}} or {{tail_number}} that may help AMG Operations complete review.

You may upload documents in the portal at {{portal_link}} or reply with questions.

AMG Operations',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","portal_link","amg_operations_email","aircraft_type","tail_number"]'::jsonb,
    true
  ),
  (
    'post_mission_follow_up',
    'Post-Mission Follow-Up Inquiry',
    'crew_coordination',
    'Post-mission follow-up: {{mission_id}}',
    'Hello {{crew_first_name}},

AMG is following up on {{mission_id}}.

Please reply with any post-mission feedback, timing notes, aircraft or crew coordination issues, FBO or ground handling notes, documentation items, or other details AMG should retain for the record.

AMG Operations',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","portal_link","amg_operations_email","mission_id","mission_date","departure_airport","arrival_airport","aircraft_type","tail_number"]'::jsonb,
    true
  ),
  (
    'credential_expiration_reminder',
    'Credential Expiration Reminder',
    'documents',
    'Crew credential update needed',
    'Hello {{crew_first_name}},

AMG records show one or more crew credentials or documents are expired or approaching expiration.

Requested documents:
{{requested_documents}}

Please upload the updated item through the AMG portal when available: {{portal_link}}

AMG Operations',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","portal_link","amg_operations_email","requested_documents"]'::jsonb,
    true
  ),
  (
    'profile_information_request',
    'Profile Information Request',
    'crew_coordination',
    'AMG crew profile update requested',
    'Hello {{crew_first_name}},

AMG is updating crew network records and needs your current profile information.

Please review your availability, aircraft types, rates, home airport, service areas, contact details, and any recent qualification changes. You can update your profile in the AMG portal: {{portal_link}}

AMG Operations',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","portal_link","amg_operations_email","home_airport"]'::jsonb,
    true
  ),
  (
    'mission_availability_check',
    'Mission Availability Check',
    'crew_coordination',
    'Crew availability check',
    'Hello {{crew_first_name}},

AMG is checking crew availability for an upcoming date range, aircraft type, or location.

Aircraft: {{aircraft_type}}
Departure: {{departure_airport}}
Arrival: {{arrival_airport}}
Date: {{mission_date}}

Please reply with your availability, positioning constraints, and any limits AMG should consider before moving forward.

AMG Operations',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","portal_link","amg_operations_email","mission_date","departure_airport","arrival_airport","aircraft_type"]'::jsonb,
    true
  ),
  (
    'general_crew_communication',
    'General Crew Communication',
    'general',
    'AMG Crew Network update',
    'Hello {{crew_first_name}},

AMG Operations is contacting you regarding your AMG Crew Network profile.

Please review the message details and reply with any questions or updates.

AMG Operations
{{amg_operations_email}}',
    null,
    array['admin'],
    '["crew_first_name","crew_full_name","crew_email","home_airport","mission_id","mission_date","departure_airport","arrival_airport","aircraft_type","tail_number","requested_documents","portal_link","amg_operations_email"]'::jsonb,
    true
  )
on conflict (template_key) where template_key is not null do update
set name = excluded.name,
    category = excluded.category,
    subject_template = excluded.subject_template,
    body_template_text = excluded.body_template_text,
    body_template_html = excluded.body_template_html,
    allowed_roles = excluded.allowed_roles,
    variables = excluded.variables,
    active = excluded.active,
    updated_at = now();

grant select, insert, update, delete on public.communication_templates to authenticated;

select pg_notify('pgrst', 'reload schema');
