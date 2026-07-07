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

## Features+speed cycle notes
- A-1-04 (xlsx high-severity advisories) — DEFERRED TO OWNER. Removing the dep would break the CRM
  spreadsheet IMPORT (client-side XLSX.read of admin-chosen files), a real feature. The recommended
  fix is switching package.json to the maintainer's patched build
  ("xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz" — npm registry copy is abandoned at
  0.18.x with no fix), which the sandbox correctly refused to install without owner approval.
  Practical exposure meanwhile: server export path is write-only (not the vulnerable parse paths);
  the import parse runs in the admin's own browser on a file the admin chose. One-line owner action.

---

## Session-3 single-agent review (dual-plan cycle, per owner instruction)

Verdicts: visual SHIP (1 fix), catalog FIX-FIRST (3 MED + LOWs). All confirmed findings fixed same-session:

| # | Sev | Finding | Resolution |
|---|-----|---------|-----------|
| 1 | MED | "On-Demand" pricing header still wrapped at the hyphen despite whitespace-nowrap | Non-breaking hyphen at render time (copy string unchanged) |
| 4 | MED | services.ts child-table writes unchecked; oversized price could close the open variant row then fail the replacement insert, silently reverting the price | Every child write error-checked; price-change path compensates (reopens closed row) on failure; create/duplicate roll back the half-made service; prices bounded to numeric(12,2) range |
| 5 | MED | Stale variants_json ids (double-submit / second tab) inserted duplicate open price rows with identical axes | Reconciliation matches by id then by axes; unclaimed open rows close; duplicate axes within one submission rejected |
| 6 | MED | RLS "active read" policies exposed notes_internal + client_visible=false services to ALL authenticated users via PostgREST | Migration 20260707160000 (applied to prod) drops the four policies; portal reads use the service-role client, so nothing consumed them; client catalog phase must add a narrow column-restricted path instead |
| 8 | LOW | Draft children expanded into quotes via attachments | Engine skips non-active children; server rejects non-active child ids (attachment-child-inactive) |
| 9 | LOW | recurring_interval_count unvalidated; "Infinity" passed num() | Integer 1–60 check; num() now Number.isFinite |
| 11 | LOW | PostgREST 1000-row cap on open-variant summary query | Explicit .limit(5000) + comment |
| — | LOW | archive/retry status updates unchecked (audit could log a write that failed) | Error-checked before audit/redirect |

Review items ratified as plan-sanctioned, no action: receipt-card removal (Phase 6 explicitly offered "cut it"), team founder facts column (Phase 7 spec), connect mockup content (Phase 5 spec). Finding 7 (doc 'standard' tier vs live 'Essentials') already flagged in seed notes_internal — owner follow-up.

Deferred to backlog: variable-options multiplier metadata lost on form round-trip (no current data uses it); axis edits on open variant rows reinterpret history (letter of §5.3 honored, snapshots unaffected); request pill overlaps mission-deck spec row at 390px (content readable); variant-history pagination past 1000 rows.
