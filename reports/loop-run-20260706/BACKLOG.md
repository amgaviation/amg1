# BACKLOG — loop-run 2026-07-06

## Portal (from §4b permissions review)
- E-P-01: separate `payments` authority (or invoices.pay/void sub-actions) so cash application, void, write-off can be segregated from invoice editing — SoD for accounting. Effort: ~2-3 days (module + rewiring + defaults)
- E-P-07a: per-user permission overrides layered above role defaults (user override → role row → default → deny). Effort: ~2-3 days
- E-P-07b: notify-all-admins email on any permission change; optional dual-control approval for matrix saves. Effort: ~1-2 days / ~1 week
- A-P-04: split nav href→module map into its own module if bundle analysis shows the full catalog shipping client-side. Effort: hours
- C-P-06 (done as copy note) + richer idea: staged "preview as role" mode for the matrix. Effort: ~2-3 days
