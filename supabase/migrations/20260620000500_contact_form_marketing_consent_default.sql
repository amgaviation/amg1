alter table public.contact_form_submissions
  alter column marketing_consent set default false;

update public.contact_form_submissions
set marketing_consent = false
where marketing_consent is null;

alter table public.contact_form_submissions
  alter column marketing_consent set not null;

select pg_notify('pgrst', 'reload schema');
