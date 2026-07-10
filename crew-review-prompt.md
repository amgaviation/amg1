# Prompt for Claude Code: Merge Crew Review into Network Applications

Copy everything below the line into Claude Code.

---

Extend the existing **Network Applications** admin tab into a full crew review workflow. Do NOT create a separate "Crew Review" tab — merge these features into the existing tab. Where a requested feature already exists in Network Applications, do not duplicate it; where the new Crew Review behavior conflicts with existing behavior, **the Crew Review behavior below takes priority** (replace/upgrade the existing implementation).

Relevant existing code:

- `app/portal/admin/network-applications/page.tsx` (list)
- `app/portal/admin/network-applications/[id]/page.tsx` + `status-review-form.tsx` (detail/review)
- `app/portal/actions/network-applications.ts` (server actions)
- `lib/portal/network-applications.ts`, `lib/portal/network-application-constants.ts`
- `lib/portal/email-templates.ts` — global `amgEmailLayout()` wrapper (ALL emails must use it), sent via Resend
- `supabase/migrations/20260701090000_network_applications.sql` — `network_applications` table (+ files + status event history)
- Existing statuses: `awaiting_review`, `in_review`, `additional_information_needed`, `approved`, `denied`, `waitlist`, `other`
- Existing behavior to keep: status-change emails, status event audit history, approval atomically creating auth user + portal profile + crew_profiles row + password setup link.

## 1. Decision emails (replace/upgrade the current status-change email content — Crew Review versions take priority)

Rewrite the four decision emails in `lib/portal/email-templates.ts`, all wrapped in `amgEmailLayout()`, consistent with the existing template tone:

**Approved** — Subject like "You're Approved — Next Steps with AMG Aviation Group". Congratulate them, then list clear next steps:
1. Set up your account / crew profile using the link below.
2. Complete your profile — certificates, ratings, flight time, availability, and required documents.
3. Our crew team reviews completed profiles and will reach out regarding assignments/onboarding.
Prominent CTA button linking to the crew profile setup. Keep using the existing approval flow's password-setup/invite token link tied to their email.

**Denied** — Professional and respectful. Thank them for their interest, state we are unable to move forward at this time, include the denial reason (see §2), and note they are welcome to reapply if circumstances change.

**Waitlisted** — Explain that our current crew needs are met / we are at capacity for their position, they have been placed on our waitlist, and we will reach out if our needs change. Encourage them to keep an eye on their status and keep their contact info current.

**Under Review** — Sent for `awaiting_review`/`in_review` (or via an explicit action): confirm AMG has received their profile/application, it is under review, and we will contact them with a decision or if we need further information. No action needed from them.

Keep the existing `additional_information_needed` email as-is.

## 2. Denial reasons (new)

The deny flow must offer a dropdown of pre-made reasons plus a "Custom reason" free-text option. Store the chosen/typed reason on the application (add a `denial_reason` column via migration) and insert it into the denial email. Seed these in `lib/portal/network-application-constants.ts` so I can edit them:

1. Total flight time does not meet our current minimum requirements.
2. Certificate or type ratings do not match our current fleet and operational needs.
3. Application is incomplete — required documentation or information was not provided.
4. Current medical certificate class does not meet the requirements for this position.
5. Experience profile does not align with the positions we are currently staffing.
6. We were unable to verify the references or employment history provided.
7. Position applied for has been filled.
8. Base/location requirements could not be met for our current operational needs.

## 3. Review UX upgrades (in the existing tab)

- Status-change actions must show a confirmation modal previewing the exact email that will be sent before sending.
- Track and display `decision_email_sent_at` (add column if needed) and allow re-sending the last decision email.
- List page: status filter + name/email search if not already present; color-coded status badges.
- Manual "Add prospect" button: small form (name, email, phone, position, hours, notes) that creates a `network_applications` row with status `awaiting_review` and `source: 'manual'` — so I can enter pilots who emailed me directly and run them through the same review/email flow.

## 4. CSV / XLSX import (new)

- "Import prospects" button in the Network Applications tab accepting `.csv` and `.xlsx` (use SheetJS or similar for XLSX; reuse parsing ideas from `scripts/import-crew-profiles-from-csv.ts` where sensible).
- Rows import into `network_applications` with status `awaiting_review`, `source: 'csv_import' | 'xlsx_import'`, and an `import_batch_id` (add columns via migration).
- Expected columns (case-insensitive, flexible header matching): first name, last name, email, phone, position, certificates/ratings, total hours, notes. Email required — skip and report invalid rows.
- Pre-import preview with row count and validation errors; dedupe against existing applications and existing users by email.
- Post-import summary: imported / skipped / duplicates.

## 5. Approval → account creation → user approvals queue

The existing approval flow already creates the auth user + profiles + crew_profiles and sends a setup link — keep that. Additionally guarantee:

- Accounts created through Network Applications approval are **automatically approved / never appear in the User Approvals queue** (they were already vetted here). If the current flow can leave them pending in the `user-approvals` tab, hook into that logic and auto-approve on account completion when the email matches an approved network application.
- Reflect "account created" in the Network Applications list (e.g. a column/badge showing whether the approved applicant finished setup).

## 6. Quality bar

- Match existing code style, server-action patterns, and admin UI components exactly. No duplicated logic between old and new paths — one unified flow.
- New columns via proper Supabase migrations; regenerate TypeScript types; respect existing RLS patterns.
- Validate emails server-side; handle Resend failures gracefully (don't silently flip status if the send failed — surface the error with a retry).
- Typecheck, lint, and build must pass. Test: each of the 4 decision emails renders inside `amgEmailLayout()`, denial reason flows into the denied email, CSV and XLSX import both work, manual add works, and an approved applicant who completes setup never shows in User Approvals.
