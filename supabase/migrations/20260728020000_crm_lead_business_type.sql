-- Business type on a CRM lead.
--
-- The outreach sequence picks its template copy by business type, and until now
-- that value was supplied by the admin in the moment they enrolled a single
-- lead by hand. Bulk enrolment has no such moment: a few hundred leads are
-- enrolled in one action, and each has to carry its own type so the right
-- template variant reaches it — an MRO should not receive the broker letter.
--
-- Storing it on the lead also makes "outreach to MROs and brokers only"
-- expressible as a query instead of a filter somebody has to remember to apply
-- by hand every time.

alter table public.crm_leads
  add column if not exists business_type text not null default 'general';

-- Mirrors LEAD_BUSINESS_TYPES in lib/portal/lead-email-templates.ts. A value
-- outside this set has no template, so the sequence would enrol the lead and
-- then fail at the first send; rejecting it at write time is the cheaper
-- failure.
alter table public.crm_leads
  drop constraint if exists crm_leads_business_type_check;

alter table public.crm_leads
  add constraint crm_leads_business_type_check check (
    business_type in ('mro', 'broker', 'owner', 'flight_dept', 'general')
  );

create index if not exists crm_leads_business_type_idx
  on public.crm_leads (business_type);

-- The bulk-enrol query always asks the same question: which leads of these
-- types are actually emailable? Indexing that exact shape keeps it cheap as the
-- pipeline grows.
create index if not exists crm_leads_outreach_eligible_idx
  on public.crm_leads (business_type, stage)
  where email is not null and do_not_contact = false;
