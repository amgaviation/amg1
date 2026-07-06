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
