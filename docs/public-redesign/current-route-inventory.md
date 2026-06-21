# AMG Public Redesign Route Inventory

Date: 2026-06-21
Branch: `redesign/magma-inspired-aviation-production`
Repository: `amgaviation/amg1`

## Summary

The repository is a Next.js App Router application with a public route group at `app/(public)` and protected AMG Connect portal routes under `app/portal`. The redesign work is scoped to public layout, public homepage sections, public error/loading states, and public documentation. Protected portal pages, auth callbacks, Supabase middleware, API routes, database migrations, billing, quotes, invoices, storage, and role-routing files were not modified.

## Public Routes

| Route | Page name | Form | Backend dependency | Metadata source | CTA targets | Redesign treatment | Internal behavior |
|---|---|---:|---|---|---|---|---|
| `/` | Homepage | No | None direct | `metadataForWebsiteContent("home")` | `/request-support`, `/contact`, `/login`, `/amg-connect`, detail pages | New continuous public narrative after cockpit entrance | Public route changed visually only |
| `/about` | About AMG | No | Website content module | `metadataForWebsiteContent("about")` | `/request-support`, `/contact` | Existing detail route keeps public shell and hero | No backend dependency |
| `/capabilities` | Services / capabilities | No | Website content module | `metadataForWebsiteContent("services")` | `/request-support`, `/plans`, `/contact` | Existing detail route remains; homepage now links into it | No backend dependency |
| `/services` | Services redirect | No | `next/navigation redirect` | Route redirect | `/capabilities` | Preserved redirect | Must remain redirect |
| `/operations` | Operations redirect | No | `next/navigation redirect` | Route redirect | `/capabilities` | Preserved redirect | Must remain redirect |
| `/aircraft-support` | Aircraft supported / support context | No | Website content module | `metadataForWebsiteContent("aircraft-support")` | `/request-support`, aircraft section links | Existing detail route remains; homepage adds aircraft context | No backend dependency |
| `/aircraft` | Aircraft redirect | No | `next/navigation redirect` | Route redirect | `/aircraft-support` | Preserved redirect | Must remain redirect |
| `/crew-network` | Crew network | No | Dynamic 3D globe component; static public marker data | `metadataForWebsiteContent("crew-network")` | `/request-support?category=contract-pilot-support`, `/credential-submission` | Existing detail route remains; homepage uses reduced-motion globe fallback | No sensitive crew location data exposed |
| `/pilot-network` | Pilot network redirect | No | `next/navigation redirect` | Route redirect | `/crew-network` | Preserved redirect | Must remain redirect |
| `/plans` | Support plans / comparison | No | `lib/plans.ts` static plan model | `metadataForWebsiteContent("plans")` | `/request-support?category=subscription-program-inquiry`, `/contact` | Existing plan builder preserved | No purchasing behavior |
| `/amg-connect` | Public AMG Connect overview | No | Website content module; portal screenshots | Static `Metadata` | `/login`, `/login?mode=request`, `/request-support` | Existing public overview preserved; homepage Connect section links to it | Does not recreate auth |
| `/contact` | Contact | Yes | `submitContactInquiry` server action | `metadataForWebsiteContent("contact")` | `/request-support`, mailto | Existing form handler preserved | Public form submission contract unchanged |
| `/request-support` | Start support request | Yes | `submitSupportRequest` server action | Static `Metadata` | `/contact`, legal links | Existing form handler preserved | Public form submission contract unchanged |
| `/booking-request` | Legacy booking request redirect | No | `next/navigation redirect` | Route redirect | `/request-support` | Preserved redirect to support request language | Avoids charter-booking language |
| `/portal-setup` | Portal access setup | Yes | Supabase browser client; `/api/portal-setup/complete` | Static metadata | `/login` after setup | Unchanged except public shell context | Auth behavior unchanged |
| `/login` | Member login / request access entry | Yes | Supabase auth through `PortalLogin` | Static `Metadata` | Portal role routes after auth | Protected portal entry remains accessible | Auth behavior unchanged |
| `/forgot-password` | Password reset request | Yes | Existing auth action | Static metadata | `/login` | Preserved | Auth behavior unchanged |
| `/reset-password` | Reset password | Yes | Existing auth action | Static metadata | `/login` | Preserved | Auth behavior unchanged |
| `/signup` | Signup / access routing | No | Existing public page | Static metadata | `/login`, `/portal-setup` | Preserved | Access flow unchanged |
| `/privacy-choices` | Privacy choices | Yes | `privacy-choices/actions.ts`; compliance evidence | Static metadata | Legal links | Preserved | Compliance behavior unchanged |
| `/legal` | Legal index | No | `lib/compliance/legal-pages.ts` | `metadataForWebsiteContent("legal")` | Legal detail pages | Preserved | Legal content unchanged |
| `/legal/[slug]` | Legal detail | No | `lib/compliance/legal-pages.ts` | Legal document metadata | Legal links | Preserved | Legal content unchanged |
| `/privacy-policy` | Privacy policy | No | `LegalDocumentPage` | Static metadata | Legal links | Preserved | Legal content unchanged |
| `/cookie-policy` | Cookie policy | No | `LegalDocumentPage` | Static metadata | Cookie preferences | Preserved | Consent behavior unchanged |
| `/terms` | Terms | No | `LegalDocumentPage` | Static metadata | Legal links | Preserved | Legal content unchanged |
| `/mission-acceptance` | Mission acceptance | No | `LegalDocumentPage` | Static metadata | `/request-support` | Preserved | Legal content unchanged |
| `/operational-disclaimer` | Operational disclaimer | No | `LegalDocumentPage` | Static metadata | Legal links | Preserved | Legal content unchanged |
| `/credential-submission` | Credential notice | No | `LegalDocumentPage` | Static metadata | Legal links | Preserved | Legal content unchanged |
| `/accessibility` | Accessibility | No | `LegalDocumentPage` | Static metadata | `/contact` | Preserved | Legal/accessibility copy unchanged |
| `/faqs` | FAQs | No | Website content module | `metadataForWebsiteContent("faqs")` | `/request-support`, `/contact` | Preserved | No backend dependency |
| `/motion-assets` | Motion assets audit | No | Existing showcase component | Static metadata | Asset references | Preserved | No backend dependency |
| `/access-denied` | Access denied | No | Existing public page | Static metadata | `/portal`, `/login` | Preserved | Auth boundary unchanged |
| `/pending-approval` | Pending approval | No | Existing public page | Static metadata | `/login` | Preserved | Auth boundary unchanged |
| `/team` | Team | No | Static public team content | Static metadata | `/contact` | Preserved | No backend dependency |

## Protected Route Boundary

Representative protected route families:

- `/portal/admin/*`
- `/portal/client/*`
- `/portal/crew/*`
- `/portal/partner/*`
- `/portal/super-admin/*`

Treatment: protected portal UI and behavior are intentionally unchanged in this branch. Public CSS additions are scoped to `.public-site.amg-oc` and public route-group components.

## Public API And Server Actions

| Surface | File | Public dependency | Treatment |
|---|---|---|---|
| Contact submission | `app/(public)/contact/actions.ts` | `submitContactInquiry` | Unchanged |
| Support request submission | `app/(public)/contact/actions.ts` | `submitSupportRequest` | Unchanged |
| Privacy choices | `app/(public)/privacy-choices/actions.ts` | Compliance evidence | Unchanged |
| Cookie consent | `components/compliance/cookie-consent.tsx` and `/api/compliance/consent` | Consent storage and evidence | Behavior unchanged; presentation retained |
| Portal setup | `app/(public)/portal-setup/portal-setup-form.tsx` | Supabase auth and `/api/portal-setup/complete` | Unchanged |
