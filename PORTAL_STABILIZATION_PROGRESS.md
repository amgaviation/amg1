# Portal Stabilization Progress

Branch: `portal-redesign-stabilization`

## Completed In This Pass

- Added subscription management schema:
  - `subscription_plans`
  - `subscription_plan_tiers`
  - `client_subscriptions`
  - `subscription_usage_events`
  - `subscription_credits`
- Added admin subscription routes:
  - `/portal/admin/subscriptions`
  - `/portal/admin/subscriptions/new`
  - `/portal/admin/subscriptions/[id]`
- Added client subscription routes:
  - `/portal/client/subscriptions`
  - `/portal/client/subscriptions/[id]`
- Added subscription actions for admin plan creation, client subscription creation, status updates, usage logging, and credits.
- Added subscription dashboard cards and quick actions for admin and client portals.
- Hardened document upload/download handling:
  - Private `documents` and `crew-credentials` storage buckets.
  - Server-side PDF/JPEG/PNG and 50 MB validation.
  - Document metadata columns for original file name, bucket, MIME type, file size, review time, and rejection reason.
  - Signed download route with explicit role/scope checks.
  - Admin document uploads can target a client, crew member, or partner profile.
- Added download links to client, partner, admin, and crew credential document lists.
- Added admin document review filters for status, visibility, owner, role/scope, date range, and document-name search.
- Added default AMG subscription plan templates for production seeding.
- Corrected the admin subscription overage stat so it reads logged usage events.
- Added automatic subscription usage logging when an admin marks a covered mission completed.

## Supabase Status

Project: `AMG Aviation Portal` (`vsynqnqlouvphiniqaiy`)

Applied migrations:

- `portal_subscriptions`
- `portal_document_storage_hardening`
- `seed_subscription_plan_templates` is committed and ready to apply.

Live schema verification passed for:

- Subscription tables
- `documents.storage_bucket`
- Private `documents` bucket
- Private `crew-credentials` bucket

## Local Verification

- `npm run typecheck` passed.
- `npm run build` passed.
- Portal navigation audit checked 44 configured portal links and found 0 missing routes.

## Remaining Larger-Scope Work

- Finish a full end-to-end browser QA pass against the deployed preview after Vercel finishes building this branch.
- Apply `seed_subscription_plan_templates` to the Supabase project after this commit is pushed, then verify the admin subscription plan list shows the defaults.
- Regenerate Supabase TypeScript types after the new schema is fully settled.
- If Supabase Data API access is required for these new tables, confirm API exposure settings in the Supabase dashboard because new public tables may not be exposed automatically.
