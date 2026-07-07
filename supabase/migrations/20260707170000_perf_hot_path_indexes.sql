-- Perf pass (owner-reported click→page latency): additive indexes for the
-- read paths the portal actually pays on navigation. Postgres MVCC means
-- readers never block (no NOLOCK equivalent needed) — these exist to keep the
-- hot lookups index-backed as tables grow.
--
-- Chosen against live pg_indexes + the Supabase performance advisor; cold
-- audit-ish FK columns (created_by / reviewed_by / *_by) are intentionally
-- NOT indexed — they'd cost writes and help no user-facing query.

-- countUnread(user_id) runs on EVERY portal page render (shell unread badge).
-- Partial index keeps it O(unread) regardless of notification history size.
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where not is_read;

-- Legacy mission-thread messages: thread view lists by thread_id.
create index if not exists messages_thread_idx
  on public.messages (thread_id);

-- Trip detail resolves its thread by mission.
create index if not exists message_threads_mission_idx
  on public.message_threads (mission_id);

-- "Threads for this user" reverse lookup; the PK leads with thread_id so it
-- cannot serve profile-first scans.
create index if not exists thread_members_profile_idx
  on public.thread_members (profile_id);

-- Crew dashboard / assignments filter missions by assigned crew.
create index if not exists missions_assigned_crew_idx
  on public.missions (assigned_crew_id);

-- Trip detail lists documents by mission.
create index if not exists documents_mission_idx
  on public.documents (mission_id);

-- Audit log lists the newest N events; audit_events grows faster than any
-- other table (every portal action inserts), so the sort must be index-backed.
create index if not exists audit_events_created_at_idx
  on public.audit_events (created_at desc);

-- Receivables / overdue views and the nightly cron filter invoices by status.
create index if not exists invoices_status_idx
  on public.invoices (status);
