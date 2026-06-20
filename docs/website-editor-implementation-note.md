# Super Admin Website Editor Implementation Note

## Existing Patterns Used

- Roles are defined in `lib/portal/constants.ts`.
- Session/profile loading is enforced through `lib/portal/session.ts`.
- Portal route guards use `requireUser`, `requireRole`, and the new `requireSuperAdmin`.
- Portal navigation is centralized in `PORTAL_NAV` and rendered by `components/portal/shell/portal-shell.tsx`.
- Access denied behavior remains `/access-denied`.
- Supabase privileged writes use `createServiceClient()` only inside server actions after server-side role checks.

## Super Admin Integration

- Added the `super_admin` role to the central `PortalRole` type.
- Added `ROLE_HOME.super_admin = /portal/super-admin/website-editor`.
- Added Super Admin-only nav entries for Website Editor and Preview History.
- `requireRole()` and server action `actor()` treat `admin` and `super_admin` as admin-capable roles for existing admin surfaces.
- `requireSuperAdmin()` enforces exact `super_admin` for the Website Editor and preview routes.
- Normal admin user-management forms still use `PORTAL_ROLES`, which intentionally excludes `super_admin`.
- Forged server-action submissions cannot assign `super_admin` unless the actor is already `super_admin` and the target email is `tony@amgaviationgroup.com`.

## Database Migration

Migration: `supabase/migrations/20260620120000_super_admin_website_editor.sql`

- Extends `profiles.role` validation to include `super_admin`.
- Assigns only `tony@amgaviationgroup.com` as approved active Super Admin.
- Adds `website_content_drafts`.
- Adds `website_publish_events`.
- Enables RLS on both editor tables.
- Grants authenticated Data API access only behind RLS policies that require approved active `super_admin`.
- Revokes anon access and grants service-role access for trusted server actions.

## Editor Routes

- `/portal/super-admin/website-editor`
- `/portal/super-admin/website-editor/preview/[draftId]`

Both routes require Super Admin auth and block access when `WEBSITE_EDITOR_ENABLED=false`.

## Content Safety

Editable content lives under `/content/site/` and is restricted to known page slugs. Validation rejects unknown slugs, arbitrary file paths, path traversal, unsafe hrefs, script tags, iframe tags, event-handler markup, missing enabled-section headlines, and unapproved image keys.

Draft saves write only to Supabase and do not affect production.

Publishing creates a GitHub branch and PR that updates only approved `/content/site/*.json` files. Merge is blocked unless the PR belongs to the Website Editor workflow, only changes approved content paths, and checks pass when checks are available. The feature does not blindly push to `main`.

## Environment Variables

Configure these in Vercel for publishing:

- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_DEFAULT_BRANCH=main`
- `WEBSITE_EDITOR_ENABLED=true`

The GitHub token is read only in server-side code and is never exposed to client components.
