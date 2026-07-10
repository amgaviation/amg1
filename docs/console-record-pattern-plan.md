# Plan: Console Record Pattern — Unified List / Modal Layout

Status: PLAN ONLY. Nothing implemented. Standardizes 15 admin console pages on the
layout of **Support Requests** (list reference) and **Communications** (header
reference): slim full-width record tables with no internal scrolling, record detail
in a pop-up window, and every "add/new" flow moved into a pop-up form.

## The pattern ("Console Record Pattern")

Every page gets the same four layers, top to bottom:

**1. Page header** (Communications style)
Eyebrow (`AMG OPERATIONS` / `AMG BILLING`), H1, one-sentence description. Primary
action button top-right: `+ New <Record>`. Optional secondary (e.g. Board view,
Export). No inline forms anywhere on the page.

**2. Toolbar** (Support Requests style)
One row of status chips (contextual per record type: All / Active / New / …), then
one row: search input + 2–3 scoped dropdown filters + sort + Apply, with the
`X / Y records` count right-aligned. Pages that currently stack many chip rows
(Pricing & Services has four) collapse to one status-chip row; the rest become
dropdowns.

**3. Records table — slim, no internal scroll**
- The table grows with the page; the page scrolls, never a nested scroll area.
- Long lists paginate (25/page) with the existing Pagination kit component in the
  table footer — pagination replaces scrolling, keeping the DOM flat.
- Column budget: 4–7 columns. First column is the record's identity (mono ref link
  or name), last column is a StatusBadge chip. Everything else lives in the detail
  window, not the table.
- Row click (anywhere, not just the ref) opens the detail window.

**4. Detail window (modal)**
- Opens over the list; list state (filters, page) is preserved behind it.
- URL-synced: `?record=<id>` so refresh, back button, and shared links reopen the
  same record. Esc / ✕ / backdrop click closes and returns to the list.
- Layout inside: header (ref + StatusBadge + primary actions), key-facts grid,
  then sections as needed — related records (mission, client, quote links),
  financial lines, documents, activity/notes.
- Full-screen sheet on mobile. Focus-trapped, `role="dialog"`, Esc closes.

**5. Create/edit window (modal)**
- Every current inline "New Task / New Lead / Standalone Invoice"-style mega-form
  is removed from the page body and becomes the `+ New <Record>` button's modal,
  reusing the same field primitives (`components/portal/ui` fields).
- Multi-mode creators (Invoices: "From accepted quote" vs "Standalone") become
  tabs inside one modal.
- Bulk import/export (Sales Pipeline) also moves into a modal, launched from a
  secondary header button.

## New shared primitives (additive — no kit renames)

Build once in `components/portal/ui/`, reuse across all 15 pages:

- `RecordListShell` — header + toolbar + slim table + pagination wiring.
- `RecordModal` — URL-synced detail dialog with the section layout above.
- `FormModal` — create/edit dialog wrapping existing field components.
- `useRecordParam` — hook syncing `?record=` with modal open state.

All styling via `--deck-*` tokens and existing deck classes inside `.amg-portal`
`@layer components`. No per-page CSS. Existing kit exports (PageHeader, DataTable,
FilterTabs, StatusBadge, Pagination, SectionCard, fields) keep their names —
roughly 100 pages import them.

## Per-page column spec (front-facing table only)

| Page | Table columns (in order) | Create modal |
|---|---|---|
| Sales Pipeline | Lead (name · company), Source, Est. value, Next action, Owner, Status | New Lead; Bulk Import as second modal. KPI cards stay above toolbar |
| Form Submissions | Ref, Name / company, Form type, Submitted, Status | — (inbound only); "Convert to lead" action inside detail modal |
| Network Applications | Applicant, Requested role, Aircraft/types, Submitted, Status | — (inbound); Approve/Decline actions in detail modal |
| Clients | Client, Company, Plan tier, Aircraft, Status | New Client |
| Crew | Name, Certificates (truncated), Location, Aircraft/types, Total time, Approved | New Crew Member |
| Aircraft | Tail #, Type/model, Owner/client, Base, Status | New Aircraft |
| Partners | Partner, Partner type, Contact, Location, Status | New Partner |
| All Users | Name, Email, Role, Company, Last active, Status | New User / Invite |
| Quotes | Quote #, Mission, Client, Total, Status, Created | New Quote (replaces "New Quote" link + full-page open) |
| Invoices | Invoice #, Client, Mission, Total, Due, Status | New Invoice — tabs: From Quote / Standalone |
| Payments | Payment #, Invoice, Client, Amount, Method, Status | Record Payment |
| Receipts | Receipt #, Mission, Vendor, Category, Amount, Date | Upload Receipt |
| Expenses | Expense #, Mission, Crew, Category, Amount, Status | New Expense |
| Subscriptions | Client, Plan, Band, Monthly fee, Renewal, Status | New Subscription |
| Pricing & Services | Code, Name, Cost type, Frequency, Price, Status | New Service |

Detail modals show everything else the current pages/tables display (and the full
record), so no information is lost — it just moves one click deep.

## Settings page — tabbed layout

Settings is not a record list, so the Record Pattern doesn't fix it by itself; it
gets its own treatment in the same visual language. Replace today's long stack of
cards with the standard page header plus a tab bar (styled like the toolbar's
status chips / FilterTabs, URL-synced via `?tab=` so tabs are linkable and survive
refresh). One tab visible at a time, no page-length pileup:

| Tab | Contents (from current page) |
|---|---|
| Account | Name, email, role, status summary card |
| Login & Security | Portal email change, new password, monthly security/permission review link |
| Permissions | Role permissions manager (view/add/edit/delete per module) |
| Billing | Protected billing settings (link-through keeps its existing guard) |
| Email Templates | Template editor entry + description |
| Compliance | Legal notices, privacy requests, consent events, compliance controls |
| Operational | Operational configuration notes, storage-bucket/env checklist |

Each tab reuses SectionCard internals unchanged — content moves, logic doesn't.
The same tab primitive should be built once (e.g. `SettingsTabs` or a generic
`PageTabs` in the kit) so any future non-list page can use it.

## Build order

- **Phase 0 — primitives + pilot.** Build the four primitives; convert one
  mid-complexity page end-to-end (Partners or Quotes) as the pattern proof.
  Ship to a Vercel preview; approve look/feel before touching anything else.
- **Phase 1 — Billing:** Quotes, Invoices, Payments, Receipts, Expenses,
  Subscriptions, Pricing & Services.
- **Phase 2 — Directory:** Clients, Crew, Aircraft, Partners, All Users.
- **Phase 3 — Pipeline:** Sales Pipeline, Form Submissions, Network Applications.
- **Phase 4 — Settings:** tabbed layout via the shared `PageTabs` primitive
  (small, independent — can slot after Phase 0 if wanted sooner).
- One branch + PR per phase. Preserve routes, data fetching, and behavior — this is
  a presentation-layer refactor; server actions and queries stay as-is.

## Guardrails (from CLAUDE.md / repo contract)

- Check `docs/PORTAL_PROTECTED_FILES.md` before touching any listed file.
- `scripts/verify-portal-overflow-layout.mjs` asserts overflow/layout details and
  `verify-admin-access-communications.mjs` asserts nav/token surfaces — removing
  internal scroll areas will trip them; **update these scripts in the same PR** as
  the intentional redesign, comparing against a main baseline first (two checks
  already fail on main).
- Restyle only via tokens/kit; custom classes stay inside `@layer components`.
- No `tracking-*` utilities (globally zeroed) — use `[letter-spacing:x]` or
  `.deck-eyebrow` for the mono eyebrow text.
- `npm run build` is unreliable locally; treat Vercel preview builds as the
  authoritative check. Only one `next dev` at a time.
- Nav IA (`DECK_NAV` in `lib/portal/constants.ts`) is unchanged by this plan.

## QA checklist (every converted page)

No nested scrollbars at 1280/1440/1920 and mobile. Row click, `?record=` deep link,
back button, and Esc all behave. Create modal validates and writes identically to
the old inline form. Filters + pagination + count agree. Status chips match the
record type's real statuses. Dark-mode (portal theme cookie) renders correctly.
Run `npm run typecheck`, the `*:verify` guard scripts (against main baseline), and
confirm on Vercel preview.
