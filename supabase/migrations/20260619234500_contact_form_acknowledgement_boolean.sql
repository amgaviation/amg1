alter table public.contact_form_submissions
  alter column acknowledgement drop default;

alter table public.contact_form_submissions
  alter column acknowledgement type boolean
  using case
    when acknowledgement is null then null
    when lower(acknowledgement::text) in ('1', 'true', 'yes', 'on', 'accepted', 'checked') then true
    when lower(acknowledgement::text) in ('0', 'false', 'no', 'off', 'not accepted', 'unchecked') then false
    else null
  end;

alter table public.contact_form_submissions
  alter column acknowledgement set default false;

select pg_notify('pgrst', 'reload schema');
