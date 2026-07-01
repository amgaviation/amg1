-- Cover access-management foreign keys added for status lifecycle fields.

create index if not exists profiles_waitlisted_by_idx
  on public.profiles (waitlisted_by);

create index if not exists profiles_denied_by_idx
  on public.profiles (denied_by);

create index if not exists profiles_suspended_by_idx
  on public.profiles (suspended_by);

create index if not exists profiles_deleted_by_idx
  on public.profiles (deleted_by);

create index if not exists profiles_status_updated_by_idx
  on public.profiles (status_updated_by);

create index if not exists access_requests_reviewed_by_idx
  on public.access_requests (reviewed_by);

create index if not exists access_requests_waitlisted_by_idx
  on public.access_requests (waitlisted_by);

create index if not exists access_requests_denied_by_idx
  on public.access_requests (denied_by);

create index if not exists access_requests_suspended_by_idx
  on public.access_requests (suspended_by);

create index if not exists access_requests_deleted_by_idx
  on public.access_requests (deleted_by);

create index if not exists access_requests_status_updated_by_idx
  on public.access_requests (status_updated_by);

create index if not exists portal_user_status_events_changed_by_idx
  on public.portal_user_status_events (changed_by);
