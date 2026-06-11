# AMG Connect Portal System Architecture

## Scope

AMG Connect is the authenticated operating system for AMG Aviation Group. It is not the public marketing website. It supports aircraft owners, approved representatives, pilots and crew, AMG administrators, and aviation partners who participate in aircraft support work.

The portal must centralize support requests, aircraft records, crew readiness, partner tasking, documents, approval gates, messages, billing packets, and audit history while keeping each role limited to the information required for its work.

## Primary Portals

| Portal | Audience | Core outcomes |
| --- | --- | --- |
| Client Portal | Owners, family offices, approved representatives | Submit support requests, manage passenger context, view aircraft and documents, approve changes, message AMG Operations |
| Crew Portal | Pilots, contract crew, aircraft managers, maintenance coordinators | Manage credentials, view assignments, review manifests, acknowledge changes, submit availability and completion notes |
| Admin Portal | AMG operations, admins, compliance, finance | Control access, manage lifecycle stages, assign crew/partners, govern documents, review audit events, close billing packets |
| Partner Portal | FBOs, maintenance facilities, ground transport, catering, hotels, vendors | View assigned task slices, confirm services, submit quotes, upload partner documents, message AMG on assigned work |

## Operating Principles

1. Role-based access is the default. Every page, action, document, message, and export is checked against role and record relationship.
2. Permission overrides are explicit and auditable. Admins can grant exceptional access, but every override has a reason, scope, expiration, and audit event.
3. Passenger, owner, aircraft, and crew credential data are treated as sensitive operational data.
4. Workflow stages are controlled by the system. Users may request changes, but admin or role-specific approvals decide when a record advances.
5. Partners receive task-level slices only. They should not see owner, passenger, crew compensation, or unrelated mission context by default.
6. The portal should work as a high-signal operations surface, not a decorative dashboard.

## Core System Modules

| Module | Description |
| --- | --- |
| Identity and Access | Accounts, invitations, MFA, role assignment, approval requests, suspensions, and access logs |
| Organizations | Owner entities, family offices, AMG internal teams, crew groups, and partner companies |
| Aircraft Records | Tail numbers, aircraft type, ownership links, readiness notes, document sets, support preferences |
| Support Requests | Intake, route, timing, aircraft, support category, crew requirements, passenger context, stage, and closeout |
| Crew Network | Crew profile, credentials, qualifications, aircraft experience, availability, assignment status |
| Partner Network | Vendor profiles, service areas, quotes, task confirmations, compliance documents |
| Approvals | Owner approvals, crew acceptance, admin overrides, cancellation notices, release approvals |
| Documents | Role-scoped file storage, document types, retention policy, release workflow, version history |
| Messages | Record-scoped threads for owner, crew, partner, and AMG communications |
| Finance | Draft charges, partner costs, support closeout packets, invoice status, owner release |
| Audit | Immutable events for views, edits, approvals, downloads, exports, login events, and permission changes |

## Role Permission Matrix

| Module | Client | Crew | Partner | Admin |
| --- | --- | --- | --- | --- |
| Support Requests | Create/view owned; edit before review; cancel with notice | View assigned; accept/decline; submit notes | View assigned task slice; update milestones | Full lifecycle control |
| Aircraft Profiles | View owned aircraft; request updates | View assigned aircraft; add readiness notes | View task-relevant aircraft context only | Create/edit/archive; set visibility |
| Passenger Data | Manage passenger profiles and preferences | View assigned manifest only | No access unless explicitly granted | Govern access; audit every view/change |
| Crew Credentials | No access | Manage own credentials | No access | Review, verify, expire, and request updates |
| Partner Tasks | No direct access by default | View partner status where assigned | View/update own tasks | Assign, approve, close, and audit |
| Documents | Owner-visible upload/download | Crew docs and assigned aircraft docs | Partner compliance/task docs | Full document governance |
| Messages | AMG request threads | Assignment threads | Vendor task threads | All scoped operational threads |
| Finance | View released owner packets | No default access | Submit quotes/cost docs | Draft, review, release, close |

## Request Lifecycle

1. Intake
   - Client, admin, or AMG staff creates a support request.
   - Required data: requester, aircraft, support type, date/time window, route/location, passenger context if applicable, crew need, owner authority, and uploaded documents.

2. Validation
   - AMG validates aircraft relationship, owner authority, request scope, missing documents, route limitations, and acceptance constraints.
   - The system flags credential gaps, aircraft readiness issues, insurance constraints, passenger data gaps, and partner dependencies.

3. Coordination
   - Admin assigns an AMG owner, crew candidates, partner tasks, internal checklist items, and due dates.
   - Crew and partners only see the record slices required for their roles.

4. Approval
   - Owner approval is required for material itinerary, cost, passenger, or service changes.
   - Crew acceptance is required for assignment, manifest, departure window, and operational change gates.
   - Admin override requires a reason and creates an audit event.

5. Execution
   - The request tracks tasks, messages, documents, vendor confirmations, crew status, and readiness checks.
   - Material changes reopen the relevant approval gates.

6. Closeout
   - AMG records completion status, final notes, documents, partner costs, invoice packet, exceptions, and retention tags.

## Portal Page Map

| Route | Purpose |
| --- | --- |
| `/portal` | Portal system overview, role navigation, modules, and permission matrix |
| `/portal/client` | Owner workspace: requests, aircraft, passengers, documents, approvals, AMG threads |
| `/portal/crew` | Crew workspace: assignments, availability, credentials, manifests, readiness, completion notes |
| `/portal/admin` | AMG command center: access, users, records, assignments, partner tasks, documents, finance, audit |
| `/portal/partner` | Partner workspace: assigned tasks, quotes, confirmations, document upload, task messaging |
| `/login` | Shared role entry point; future auth provider starts here |

Future route groups should split authenticated surfaces from public pages:

```text
app/
  (public)/
  (auth)/
    login/
    request-access/
  portal/
    layout.tsx
    page.tsx
    client/
    crew/
    admin/
    partner/
```

## Recommended Next.js and Vercel Architecture

| Layer | Recommendation |
| --- | --- |
| Framework | Next.js App Router on Vercel |
| Auth | Clerk, Auth0, or Supabase Auth with MFA and organization membership |
| Database | Postgres with row-level security where possible |
| ORM | Drizzle or Prisma with generated types |
| File storage | Vercel Blob, Supabase Storage, or S3-compatible storage with signed URLs |
| Realtime | Supabase Realtime, Pusher, Ably, or polling via Server Components plus client refresh |
| Email | Resend for invitations, approvals, task notifications, and credential reminders |
| Audit | Append-only `audit_events` table, written from all server mutations |
| Deployment | Vercel project `amgnewwebsite`, with preview deployments for portal branches |

Do not initialize database, storage, or email clients at module scope. Use lazy getter functions so `next build` remains safe when environment variables are not present during static evaluation.

## Data Security

Required controls:

- MFA for AMG admins and high-risk partner/crew roles.
- Signed URLs for private files.
- Server-side authorization checks for every Server Action and Route Handler.
- Admin-only export permissions for sensitive records.
- Audit events for record view, file download, permission change, approval, cancellation, and export.
- Data retention rules by document type and support request status.
- Soft delete for operational records; hard delete only through controlled admin process.

## Implementation Plan

### Phase 1 - Portal Prototype

- Replace role placeholder pages with operational surfaces.
- Create shared portal data contracts.
- Document architecture, roles, permissions, lifecycle, and schema.
- Add partner portal route.
- Keep all data mocked but structured for database migration.

### Phase 2 - Auth and RBAC Foundation

- Select auth provider.
- Add account, organization, membership, role, and permission tables.
- Implement request access flow.
- Protect `/portal/*` with authenticated server checks and role redirects.
- Add audit events for login, role change, and admin override.

### Phase 3 - Core Operations

- Implement support request CRUD and lifecycle stages.
- Add aircraft profiles and owner relationships.
- Add crew profiles, credentials, qualifications, availability, and assignments.
- Add partner profiles and vendor tasking.
- Implement record-scoped messages.

### Phase 4 - Documents and Approvals

- Add private storage and signed URL download.
- Implement document categories, visibility rules, retention, and version history.
- Add approval gates for owner changes, crew acceptance, document release, and admin override.
- Add notification emails for approvals, credential gaps, and partner tasks.

### Phase 5 - Finance, Reporting, and Admin Operations

- Add partner cost capture and support closeout packets.
- Add invoice release status and owner-visible finance packets.
- Build admin analytics for workload, request stage aging, credential gaps, aircraft readiness, and partner SLA status.
- Harden export controls and audit reports.

## Current Code Implementation

The current repository implements Phase 1 with:

- `lib/portal-data.ts` for role configuration, mock operational records, workflows, modules, and permission matrix.
- `components/portal/portal-workspace.tsx` for shared role workspace UI and system overview.
- `/portal`, `/portal/client`, `/portal/crew`, `/portal/admin`, and `/portal/partner` routes.

These files are intentionally structured so mocked data can later be replaced with server-side database queries without redesigning the UI.
