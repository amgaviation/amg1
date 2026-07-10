-- SMS verification + notification preference fields on profiles.
-- Verification state lives on the profile row: one pending code per user.
-- Codes are stored salted + hashed (never plaintext); Twilio Verify skips
-- local code storage entirely.

alter table public.profiles
  add column if not exists phone_verified_at timestamptz,
  add column if not exists phone_verification_sent_at timestamptz,
  add column if not exists phone_verification_code_hash text,
  add column if not exists phone_verification_expires_at timestamptz,
  add column if not exists phone_verification_attempts integer not null default 0,
  add column if not exists sms_notifications_enabled boolean not null default true;

-- Any phone change invalidates the existing verification no matter which code
-- path performed the update (self-serve settings, admin record edit, import).
-- Pending-code fields are only cleared when the updater did not set a fresh
-- code in the same statement (self-serve re-verification writes phone + a new
-- code hash together).
create or replace function public.reset_phone_verification_on_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.phone is distinct from old.phone then
    new.phone_verified_at := null;
    if new.phone_verification_code_hash is not distinct from old.phone_verification_code_hash then
      new.phone_verification_code_hash := null;
      new.phone_verification_expires_at := null;
      new.phone_verification_sent_at := null;
      new.phone_verification_attempts := 0;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_reset_phone_verification on public.profiles;
create trigger profiles_reset_phone_verification
  before update of phone on public.profiles
  for each row
  execute function public.reset_phone_verification_on_change();
