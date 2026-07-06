# Agent E — Business/Ops (cycle 1)

[E-1-01] P1 db — subscription credits never drawn down/applied/expired; liability overstated; read-modify-write race. OPEN (schema+RPC work; frozen). → SUMMARY priority
[E-1-02] P1 portal — no automatic overdue transition or dunning; no cron infra at all. OPEN (needs cron route; 1-2 days). → SUMMARY priority
[E-1-03] P1 portal — tax_total manually typed, never derived from taxable lines × billing_settings.tax_rate; markup columns unused. OPEN (billing logic change needs owner sign-off).
[E-1-04] P1 portal — mission status transitions unguarded; NO insurance gate before movement; no closeout gate. OPEN (business-rule change needs owner confirmation of gates).
[E-1-05] P2 portal — Stripe webhook + mark-paid-via-status paths create payments with no audit/compliance events (manual path has both). FIX NOW (mirror existing calls).
[E-1-06] P2 — credential expiry display-only; no status transition or notifications; no assignment block. OPEN (pairs with E-1-02 job).
[E-1-07] P2 — analytics missing quote turnaround/SLA, win rate, margin, utilization, credit liability. → BACKLOG (3-5 days).
[E-1-08] P2 — no crew mission-pay tracking (7-day pilot payment commitment unverifiable). → BACKLOG (2-3 days, schema).
[E-1-09] P3 — duplicate invoice-from-quote race (no unique on quote_id). OPEN (needs DB constraint; frozen).
[E-1-10] P3 — quote_number/receipt_number lack unique constraints; invoice numbering not gapless. OPEN (constraint; frozen).
[E-1-11] P3 — rejected quotes leave mission 'quoted' forever; pending_checkout subs never expire. OPEN (small behavior change; log).
[E-1-12] P3 — CRM needsFollowUp misses leads with null next_action_at. → BACKLOG (1 day).
