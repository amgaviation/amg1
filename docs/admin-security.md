# Admin Security Review

Status: required follow-up and operating procedure.

## Current Implementation

- Admin users are approved through the portal profile/status workflow.
- Suspended and pending users are redirected away from approved portal routes.
- A protected billing settings page requires password re-confirmation before editing billing terms.
- `/portal/admin/security-review` records a monthly access review in `compliance_evidence_events`.

## MFA Status

MFA is not currently enforced by the portal UI. Supabase Auth MFA enrollment/enforcement must be verified and enabled before production use of sensitive portal workflows. Do not claim MFA is active until Supabase Auth policy and admin enrollment are confirmed.

## Monthly Review

Review admin users, role/status, stale users, suspended users, billing access, document access, and any user who can download sensitive files. Complete the review in `/portal/admin/security-review` so an evidence record is created.
