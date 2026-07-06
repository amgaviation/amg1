# Agent E — Business/Ops (permissions single pass)

[E-P-01] P2 — invoices module can't segregate cash application / void / write-off from invoice editing (all invoices.edit). Structural: payments module or sub-actions. → BACKLOG + documented control weakness. (fix)
[E-P-02] P2 — saveRolePermissions audit truncates to 40 cells, free text, restore-defaults indistinguishable. Fix: uncap detail, distinct action for reset. (fix — applying)
[E-P-03] P2 — audit write best-effort; privilege change can land unlogged. Fix: check audit result, surface failure in redirect. (fix — applying)
[E-P-04] P2 — no warning when clearing admin row's critical view (users/settings); recovery path undocumented in UI. Fix: conditional confirm + copy line. (fix — applying)
[E-P-05] P2 — /portal/admin/system-health unmapped: escapes matrix entirely, visible to every admin. Fix: map under settings module + page guard. (bug — applying)
[E-P-06] P2 — crew.crew default FULL lets crew hard-delete own compliance records. Fix: rewire removeAvailabilityWindow → crew.edit, default crew.crew → VAE (view/add/edit), update migration seed; prod row synced via Restore Defaults (documented). (fix — applying)
[E-P-07] P3 — per-user overrides + dual-control/notify on permission change. → BACKLOG. (feature-suggestion)
[E-P-08] — VERIFIED: no super_admin lockout path (code short-circuit, MATRIX_ROLES exclusion, save gate, DB CHECK). No change.
