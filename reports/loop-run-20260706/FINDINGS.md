# FINDINGS — loop-run 2026-07-06

## §4b permissions review pass — consolidated triage (T+40..T+60)

Fixed this pass:
- D-P-01 P0: matrix tab unmount wiped unsaved roles on save → forceMount + hidden (permissions-matrix.tsx)
- C-P-01 P1: admin dashboard exposed + dead-ended into revoked modules → widgets/counts/links gated by permissionsForRole
- A-P-01 P2: null matrix cached 300s on DB blip → fetch throws, per-request fallback (permissions.ts)
- A-P-02 P2: getSessionUser not memoized (2× session reads per page) → React cache()
- C-P-02 P2: Cmd+K search leaked labels + dead-ends from denied modules → module-filtered queries/results
- E-P-02 P2: audit diff truncated at 40 cells; reset indistinguishable → full diff, distinct action role_permissions_reset_to_defaults
- E-P-03 P2: audit failure swallowed → checked insert, warns via ?success=saved-audit-failed notice
- E-P-04 P2: no warning clearing admin users/settings view → conditional confirm + page copy
- E-P-05 P2: system-health unmapped/ungated → mapped+guarded under settings module
- E-P-06 P2: crew could hard-delete compliance records → crew.crew default VAE; availability removal rewired to crew.edit; prod seed row synced
- D-P-02 P2: tabs clipped <375px → scroll wrapper; D-P-03 P2: sticky module column/header
- D-P-04 P2 (partial): confirm dialog Escape/initial focus/describedby/focus restore (full focus trap deferred)
- A-P-03 P3: layout awaits parallelized; B-P-02/03/04 P3: partner own-account un-gated, settings comment, parse hardening
- C-P-04/05 P3: no-access action-aware + role-aware copy; D-P-06 duplicate back link removed; C-P-06 upfront live-apply note
- D-P-05/07/08 P3: row contrast, checkbox focus ring, deck-accent, redundant span removed

Refuted (no change):
- B-P-01 "updateTag invalid without cacheComponents" — verified against next 16.2.9 source; valid in Server Actions, immediate expiry. A-P-05 independently confirmed.

Open (logged, not fixed this pass):
- C-P-03 P2: crew "documents" matrix cell inert (crew doc surfaces live under crew module) — needs product decision on crew credentials vs documents split
- D-P-04 remainder P3: full focus trap for confirm dialog
- D-P-07 remainder P3: read-only chip for non-super admins on matrix
- A-P-05 note: self-hosted multi-instance would need shared cacheHandler (Vercel unaffected)
