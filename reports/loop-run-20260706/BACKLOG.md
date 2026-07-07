# BACKLOG — loop-run 2026-07-06

## Portal (from §4b permissions review)
- E-P-01: separate `payments` authority (or invoices.pay/void sub-actions) so cash application, void, write-off can be segregated from invoice editing — SoD for accounting. Effort: ~2-3 days (module + rewiring + defaults)
- E-P-07a: per-user permission overrides layered above role defaults (user override → role row → default → deny). Effort: ~2-3 days
- E-P-07b: notify-all-admins email on any permission change; optional dual-control approval for matrix saves. Effort: ~1-2 days / ~1 week
- A-P-04: split nav href→module map into its own module if bundle analysis shows the full catalog shipping client-side. Effort: hours
- C-P-06 (done as copy note) + richer idea: staged "preview as role" mode for the matrix. Effort: ~2-3 days

## Status update — feature cycle (2026-07-06, user-directed continuation)
BUILT this run (remove from future planning):
- ✅ Nightly ops cron (item 1) — /api/cron/nightly + vercel.json; needs CRON_SECRET env to activate
- ✅ CRM stale-lead queue (item 9 / E-1-12) — pipeline tile + ?stage=stale filter
- ✅ Client "provide requested info" affordance (item 10 / B-1-09)
- ✅ Financial KPIs, partial (item 5 / E-1-07): turnaround, win rate, credit liability shipped;
     margin per mission + pilot utilization still open (margin needs a cost column — schema)
Still open, unchanged: credit drawdown (2), mission gates (3), crew pay tracking (4), /contact form (6),
payments authority (7), per-user overrides (8).

## Status update — features+speed cycle (session 2)
- ✅ Payments authority (item 7 / E-P-01) — built, catalog-only
- ✅ Message thread read-state (B-1-11) — built on notifications (last_read_at column does not exist; finding premise corrected)
- ✅ Crew lifecycle repair (B-1-02/B-1-03 + reviewDocument expiry) — built
- ✅ A-1-05 asset cleanup + A-1-06 media loading (code-side) — done; video transcode still open (no ffmpeg)
- Owner one-liner pending: xlsx → https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz in package.json

## Status update — large-features cycle
- ✅ Subscription credit drawdown + expiry (item 2 / E-1-01) — built (reconciliation job for drifted balances is a small follow-up)
- ✅ Mission gates (item 3 / E-1-04) — built with audited override
- ✅ Stripe price-mismatch hold (B-1-06) — built
- ✅ Loading/error boundaries (B-1-12) — built
Remaining top items: crew mission-pay tracking (schema), per-user permission overrides (schema), /contact page (owner), tax computation (owner rules).

## From session-3 review (deferred LOWs)
- C-3-01: service-form variable options round-trip drops per-option multiplier metadata (optionsToText flattens objects); boolean multiplier variables have no factor input (always ×1) — needed before calculator-heavy catalog services
- C-3-02: axis edits (band/category/tier) allowed in place on open variant rows reinterpret that row's history since effective_from — consider close+reopen for axis changes too
- C-3-03: request pill slightly overlaps mission-deck bottom spec row / ops ramp-cam at 390px — nudge offset or add section to its hide list
- C-3-04: variant history on service detail truncates past 1000 rows (newest kept) — paginate if catalogs ever grow that far
- C-3-05: client-facing catalog read path (when quote calculator ships client-side surfaces): narrow RLS + column-restricted view, NOT the dropped broad policies
