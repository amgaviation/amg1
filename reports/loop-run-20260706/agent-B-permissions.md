# Agent B — Functionality (permissions single pass)

CLEAN: all 25 mixed-role call sites satisfy the zero-behavior-change invariant; no missed mutating actions; missing-row=deny and DB-unreachable=defaults both hold; seed mirrors defaults; onConflict matches unique(role,module).

[B-P-01] P1 claim — updateTag invalid without cacheComponents → REFUTED by orchestrator against next 16.2.9 source (dist/server/web/spec-extension/revalidate.js): updateTag only throws outside Server Actions/route handlers; our call site is a server action; routes through same revalidate() with immediate expiry. Agent A independently verified. NO CHANGE.
[B-P-02] P3 — partner /settings re-exports profile page which was module-gated → partner could lose own account-security surface. FIXED: partner profile page reverted to requireRole("partner") (own-account surface never permission-locked).
[B-P-03] P3 — admin settings landing role-gated while nav maps settings module → intentional; comment added to the page. FIXED (documented).
[B-P-04] P3 — parsePermissionKey malformed-key hardening. FIXED: explicit throw on missing dot.
