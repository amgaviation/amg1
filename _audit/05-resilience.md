# Phase 5 — Logging, Backup & Blast-Radius Audit

## 1. Logging today

- **Audit trail:** `lib/portal/audit.ts` → `logAuditEvent()` appends to an `audit_events` table (actor id/email/role, action, detail, entity type/id). Used in ~23 places — logins, user status/role changes, document views, network-file views, message posts, admin record edits. Best-effort (failures swallowed, non-blocking).
- **Compliance evidence:** `lib/compliance/evidence.ts` records `recordSensitiveAccessEvent` / `recordComplianceEvidence` (sensitive document + billing views) into `compliance_*` tables — a second, richer trail for sensitive access.
- **Error logging:** `logServerError` centralizes server errors with correlation IDs.
- **Gaps:**
  - No evidence that logins are recorded with **IP / user-agent / geo**, so "new-location admin login" cannot be detected.
  - **Failed** logins are not logged at all (login failures `redirect` before any audit write) — brute-force attempts are invisible.
  - Audit table is written via service-role `insert`; there's no proof it is **append-only** (no DB-level revoke of UPDATE/DELETE). An attacker with service-role or admin DB access could delete their tracks.
  - Bulk reads/exports (e.g. admin financial JSON export, global search) are not specifically flagged as bulk-access events.
  - Logs live in the same database as the data — a DB compromise takes the logs with it.

## 2. Backups

- **No backup tooling/config in the repo** (no `pg_dump` scripts, no scheduled export, no `vercel.json` cron). The only mentions are aspirational: a reference doc notes "quarterly export/backup of the vault," and `vendor-subprocessor-inventory.md` lists Supabase backups as **"Needs review / Unknown."**
- Supabase provides managed backups depending on plan tier (daily backups / PITR on paid tiers) — **this is dashboard-configured and unverified**. No evidence a **restore has ever been tested**.
- `[MANUAL]`: confirm Supabase backup tier + retention + PITR, and perform one documented test restore.

## 3. Alerting

- `notifyAdmins()` exists for in-app/email admin notifications, but there are **no security alerts**: nothing fires on repeated failed logins, new-location admin login, privilege changes, or bulk data reads. Alerting is product-notification plumbing, not a security tripwire.

## 4. Blast-radius statement (if the public site were compromised right now)

Because the public site, portal, and admin are **one deployment sharing one Supabase project, one service-role credential, and one session scope**, the blast radius is effectively the whole system:

> An attacker who achieves code execution or secret disclosure in the deployed app obtains `SUPABASE_SERVICE_ROLE_KEY` from the environment. That key **bypasses RLS on every table**, granting full read/write/delete of all client, crew, partner, and applicant PII, all mission/quote/invoice/payment records, all documents in storage, and the audit log itself (which is not provably append-only, so the intrusion can be erased). The same environment holds the Stripe secret key (create charges/refunds), the Resend key (send mail as AMG), and a **GitHub token** used by the super-admin website editor — so the attacker can also push commits to the site's source repository, turning a runtime compromise into a supply-chain foothold.
>
> Separately — and not even requiring app compromise — **if RLS is disabled on the core tables (D-1, unverified), the public anon key alone** (extractable from the shipped JS bundle) lets anyone query `profiles`, `missions`, `quotes`, `documents`, and `messages` directly through Supabase's PostgREST endpoint, exfiltrating the client/crew database without ever touching the application or its guards.
>
> There is no network segmentation, no separate admin origin, and no least-privilege DB role to contain any of this. One boundary failure = total data loss.

## Phase 5 findings (to REPORT.md)

| # | Severity | Finding |
|---|---|---|
| R-1 | High | Single service-role key + shared env = full-system blast radius on any app compromise; includes GitHub token (supply-chain) and Stripe/Resend keys. |
| R-2 | Medium | Audit log not provably append-only and stored in the same DB it protects; can be tampered/erased by a privileged attacker. |
| R-3 | Medium | Failed logins and login IP/user-agent not logged → brute-force and new-location admin access undetectable. |
| R-4 | Medium | No security alerting (failed logins, privilege changes, bulk reads). |
| R-5 | High/Manual | Backup/restore posture unverified; no tested restore; backups (if any) are Supabase-managed and dashboard-only. |
