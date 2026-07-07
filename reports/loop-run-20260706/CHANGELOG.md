# CHANGELOG — loop-run 2026-07-06

## Primary task — role permissions system (LOOP_PLAN §1b)
- 8f7b520 Phase 1: catalog + can() + migration/seed (applied to prod) + database.types.ts sync (fixed 33 pre-existing typecheck errors)
- e5d5d57 Phase 2: /portal/admin/settings/permissions matrix UI + super_admin save + audit old→new
- 3ce8c58 Phase 3+4 core: actor(perm), 25 priority call sites, 75 page guards, nav filtering, /portal/no-access
- 1d9bbf1 Phase 3 complete: remaining 92 call sites wired

## Audit cycle 1 fixes
- B-1-01 P1: respondToQuote guards status (sent/viewed only) + expiry; client notices for locked/expired
- B-1-04 P2: revision_requested no longer records rejected_by/rejected_at
- D-1-01 P1: data-table mobile cards show all non-hidden columns, priority-ordered (Status/Total no longer dropped)
- E-1-05 P2: Stripe webhook + mark-paid-via-status now write audit events (+compliance evidence on admin path)
- D-1-04 P2: combobox aria-activedescendant + option ids
- D-1-03 P2: small-text contrast on public site — text-instrument-ink token + 5 class swaps (AA)
- B-1-10 P2 (partial): request-form honeypot renamed (autofill-proof) + logged; submit button pending/disabled state
- A-1-07 P3: notifyAdmins fan-out parallelized
- A-1-08 P3: removed unused material-dashboard dependency
- C-1-05 P3: signup "Wrong email" no longer dead-ends into quote form (mailto ops@)
- D-1-06 P3: FileField long-filename truncation fixed (min-w-0)
- A-1-01 P1: listAllMissions chunked fetch (no more silent 1000-row cap) + status/type/urgency filters pushed to DB for admin trips; q-search + sort remain in-memory over the filtered set. Full keyset pagination for invoices/quotes/clients logged as open.
- B-1-09 (partial) P2: updateMissionStatus validates status against MISSION_STATUS vocabulary
- C-1-04 P2: client surfaces label a just-filed request "Submitted" (was ops-word "New") via CLIENT_MISSION_STATUS_LABEL

## Cycle 2 (verification pass)
- V-2-01: removed unreachable mark-paid dead code in updateInvoiceStatus (paid is guard-rejected; payments flow through audited paths only)
- V-2-02: dashboard Business quick links now gated by module view permissions (completes C-P-01)
- V-2-03: listAllMissions chunk fetch dedups by id (boundary-row duplication under concurrent inserts)

## Feature cycle (user-directed continuation)
- Built: nightly ops cron (/api/cron/nightly + vercel.json), CRM stale-lead queue, financial KPIs (turnaround/win rate/credit liability; margin honestly omitted — no cost column), awaiting_client_info client affordance
- Adversarial review (4 skeptics, 11 findings — all addressed):
  - P1 stale-subs flapping → staleness re-based on current_period_end + 7d grace
  - P1 KPI cards frozen vs dashboard range picker → cards moved into the client dashboard state
  - P2 cron read-then-write races → single guarded UPDATE…RETURNING everywhere; audits built from actually-flipped rows
  - P2 first-run fan-out → 100/run credential cap + bounded notify concurrency (flip and notify travel together)
  - P2 converted-quote wins missed → status 'converted' counts as win with updated_at windowing
  - P2 client-info append race/unchecked write → status predicate on the write, error surfaced before audit/notify (+ error notice)
  - P2 CRM 1000-row truncation → chunked fetch in listLeads + getPipelineMetrics
  - P3s: pending_review left to human review queue; expiry counting data-driven (no cron dependency); liability excludes never-activated subscriptions

## Features + speed cycle (user-directed, session 2)
Portal features:
- Crew assignment lifecycle (B-1-02/03): decline-after-assignment reverts mission to approved + reopens auto-closed pool; assignCrew never downgrades accepted crew; new admin unassignCrew action + Remove button; reviewDocument writes 'expired' not 'approved' for lapsed credentials
- Payments authority module (E-P-01): catalog-only 'payments' module (defaults-resolved, no migration); recordInvoicePayment → payments.add; void/write-off/refund require payments.edit; payments page gated
- Message unread state (B-1-11): per-thread unread badges + mark-read-on-open, derived from the notifications table (orchestrator caught that thread_members.last_read_at does NOT exist in prod — original finding was wrong; feature reworked, types file pristine)
Public-site speed:
- 137 MiB deleted from public/ (187→50 MB): 66 unreferenced/duplicate assets incl. 13MB intro source + amg-custom mirror; full manifest in asset-cleanup.md; tbm.jpg kept (earlier audit wrong — it IS referenced)
- Video/image loading: hero video IO-gated + preload="none", showcase videos deferred to interaction, LCP image fetchPriority, lazy below-fold logos
Deferred to owner: xlsx patched-build swap (sandbox correctly blocked external tarball install; one-line package.json change documented in FINDINGS)
