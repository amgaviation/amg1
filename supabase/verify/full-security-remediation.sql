-- Read-only post-deploy checks for full_security_remediation.
-- Every result set should be empty unless an expected row shape is documented.

-- Expected: 0.
select count(*) as anon_security_definer_functions
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and has_function_privilege('anon', p.oid, 'EXECUTE');

-- Expected: exactly the 13 reviewed helper/RPC signatures.
select p.oid::regprocedure::text as authenticated_security_definer_function
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and has_function_privilege('authenticated', p.oid, 'EXECUTE')
order by 1;

-- Expected: no anon rows; authenticated has SELECT only on airports,
-- crew_presence_sessions, crew_profiles, and profiles.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by grantee, table_name, privilege_type;

-- Expected: no rows. This checks effective privileges, including PUBLIC grants.
select c.relname
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
  );

-- Expected: no rows referencing a sensitive bucket.
select policyname, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%bucket_id%'
  and (coalesce(qual, '') || ' ' || coalesce(with_check, ''))
    ~ $bucket$'(documents|crew-credentials|billing-documents|communication-attachments|network-application-files)'$bucket$;

-- Expected: five rows, all public=false.
select id, public
from storage.buckets
where id in (
  'documents',
  'crew-credentials',
  'billing-documents',
  'communication-attachments',
  'network-application-files'
)
order by id;

-- Expected: false, false, false, true, true, false, true.
select
  has_table_privilege('anon', 'public.profiles', 'UPDATE') as anon_profile_update,
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE') as authenticated_profile_update,
  has_function_privilege(
    'authenticated',
    'public.record_stripe_invoice_payment(uuid,text,text,text,text,bigint,text,timestamptz,text,text)',
    'EXECUTE'
  ) as authenticated_stripe_payment_rpc,
  has_function_privilege(
    'service_role',
    'public.record_stripe_invoice_payment(uuid,text,text,text,text,bigint,text,timestamptz,text,text)',
    'EXECUTE'
  ) as service_role_stripe_payment_rpc,
  has_function_privilege(
    'service_role',
    'public.next_billing_document_number(text)',
    'EXECUTE'
  ) as service_role_billing_number_rpc,
  has_function_privilege(
    'authenticated',
    'public.update_stripe_invoice_event_status(uuid,text,text,text,text)',
    'EXECUTE'
  ) as authenticated_stripe_status_rpc,
  has_function_privilege(
    'service_role',
    'public.update_stripe_invoice_event_status(uuid,text,text,text,text)',
    'EXECUTE'
  ) as service_role_stripe_status_rpc;

-- Expected: exactly one authenticated SELECT policy.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
order by policyname;

-- Expected: trigger_reads_metadata_role=false.
select position(
  $$raw_user_meta_data->>'role'$$
  in replace(pg_get_functiondef('public.handle_new_user()'::regprocedure), ' ', '')
) > 0 as trigger_reads_metadata_role;

-- Expected: one active postgres-owned cron row.
select username, active, command
from cron.job
where jobname = 'expire_crew_presence';

-- Expected: two UNIQUE partial indexes.
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'payments'
  and indexname in (
    'payments_provider_checkout_session_id_uidx',
    'payments_provider_payment_id_uidx'
  )
order by indexname;
