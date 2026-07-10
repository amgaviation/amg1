# Prompts for Claude Code — portal improvements

Four separate prompts. Paste each one into Claude Code as its own task, in order. Run Prompt 4 (QA pass) last.

---

## Prompt 1 — Custom Stripe subscription creation + admin-only test subscriptions

Extend the existing Stripe subscription system (webhook at `app/api/webhooks/stripe/route.ts`, admin creation flow at `app/portal/admin/subscriptions/new`, test/live mode already detected via the `STRIPE_SECRET_KEY` prefix).

**A. Custom subscription creation.** In the admin subscription creation flow, add the ability to create a fully custom subscription for a client instead of only predefined plans/products:

- Custom name/description, custom amount (USD), billing interval (weekly / monthly / quarterly / yearly), optional trial days, optional end date or number of cycles.
- Implement via Stripe ad-hoc prices (`price_data` on the subscription item, or create a one-off Price under a generic "Custom Subscription" Product) — do not clutter the Stripe dashboard with a new Product per custom subscription.
- Client picker uses the existing `listClients()` pattern; store the resulting subscription in our subscriptions table like existing ones, flagged `is_custom: true` (migration if needed).
- Admin can preview the terms (amount, interval, first charge date) before confirming. Handle Stripe errors gracefully.
- Ensure webhook handling covers these custom subscriptions identically (status updates, cancellation, payment failure).

**B. Admin-only test subscription tool.** Add a testing capability visible ONLY to the admin role:

- A "Create test subscription" action (in the subscriptions tab, clearly marked with a TEST badge) that creates a subscription against Stripe test mode using a test clock or test payment method (`pm_card_visa`), so I can verify the full lifecycle (creation → invoice → renewal → cancellation → webhooks) without charging anyone.
- Test subscriptions must be clearly flagged in our DB (`is_test: true`) and visually distinct in every list/dashboard; exclude them from all revenue/reporting numbers and from client-facing views.
- Guard rails: the action is blocked when the environment is using a live Stripe key unless explicitly confirmed via a typed confirmation, and test subscriptions can be bulk-deleted/cleaned up from the admin UI.
- Server-side role check (admin only), not just hidden UI.

Match existing code style, server actions, and RLS patterns. Typecheck, lint, build must pass. Test both flows in Stripe test mode end-to-end including webhook events (use `stripe` CLI fixtures or document manual steps).

---

## Prompt 2 — Profile setup completion check + dashboard notification (all roles)

The portal shows users a notification telling them to complete their profile setup in settings. Make this dynamic for ALL user roles (admin, client, crew, partner — dashboards at `app/portal/{role}/dashboard`):

- Define per-role "profile complete" criteria centrally (single lib function, e.g. `isProfileSetupComplete(profile, role)`), building on what exists: `crew_profiles` already has `profile_completed_at` and `profile_completion_percent`; add equivalent lightweight criteria for client/admin/partner based on their required settings fields (name, company, phone, etc. — infer required fields from each role's settings form).
- Every role's dashboard shows a "Complete your profile setup" notice (use the existing `Notice` primitive pattern from the crew settings page) with a link to their settings page — but ONLY while their profile is incomplete.
- The moment the profile is complete (checked server-side on dashboard load, and updated immediately after they save settings), the notification disappears automatically. No manual dismissal needed; no stale banners.
- Set/maintain `profile_completed_at` (add columns via migration where missing) when criteria are first met; clear it if required fields are later removed.
- Do not duplicate logic per dashboard — one shared component + one shared completeness function.

Typecheck, lint, build must pass. Test: incomplete profile shows the notice on each role's dashboard; completing settings removes it on next load without any manual action.

---

## Prompt 3 — Custom UI dropdowns portal-wide + searchable client picker

**A. Replace native OS dropdowns.** All portal form selects currently render native `<select>` elements via the `SelectField` component in `components/portal/ui/fields.tsx`, which shows the generic macOS/OS dropdown. Replace the internals of `SelectField` with a fully custom, styled dropdown that matches the portal's design system (Tailwind + the existing Radix setup — use Radix UI `Select` since `dropdown-menu.tsx` from Radix is already in the components dir):

- Keep the `SelectField` API (`{value, label}` options, name, value, onChange, disabled, required, error states) identical so every existing form gets the new UI with zero call-site changes.
- Styled to match existing inputs: same border, radius, focus ring, dark/light handling as other fields; custom chevron; styled option list with hover/selected states; keyboard navigation (arrows, type-ahead, Enter/Escape) and proper ARIA.
- Must still work inside server-action `<form>` posts (render a hidden input or use Radix Select's native form integration).
- Sweep the portal for any stray native `<select>` elements not using `SelectField` and migrate them.

**B. Searchable client picker.** Everywhere an admin links a client to something — missions, quotes, invoices, subscriptions, aircraft, and any other form using the `listClients()` native select — replace the dropdown with a searchable combobox:

- Type-to-search across company name, full name, and email (same display priority as today: company_name → full_name → email); filtered results as you type; keyboard navigable; shows a "no clients found" empty state.
- Build it as a reusable `ClientPickerField` (or generic `ComboboxField` used by a client-specific wrapper) in `components/portal/ui/` so it's one component reused across all these forms.
- Client-side filtering is fine at current scale (fetch via existing `listClients()`); structure it so it can switch to server-side search later.
- Same form-compatibility, styling, and accessibility requirements as part A. Replace every client-linking dropdown — search the codebase for all `listClients()` consumers so none are missed.

Typecheck, lint, build must pass. Test: dropdowns no longer render the OS-native menu anywhere in the portal, all existing forms still submit correct values, and the client picker filters correctly in the mission, quote, invoice, subscription, and aircraft forms.

---

## Prompt 4 — Full QA pass: every record save in the portal must work

Do a systematic QA pass across the entire portal verifying that **saving records works everywhere** — every create form, every edit/update form, and every settings page, across all roles (admin, client, crew, partner). If anything fails, fix it — whatever the fix requires (server action, validation, query, RLS policy, missing column/migration, form wiring, redirect/revalidation). Don't just report broken saves; repair them.

**Scope — enumerate first, then test.** Search the codebase for every server action / API route that inserts or updates records and every form that submits to them. Build a checklist covering at minimum: missions, quotes, invoices, subscriptions (incl. custom + test), aircraft, clients/profiles, crew profiles, network applications (status changes, denial reasons, manual add, imports), user approvals, and each role's settings/profile forms — plus anything else the sweep finds. Include the new features from Prompts 1–3.

**For each form, verify:**

- A valid submit persists to the database (confirm the row actually changed, not just that no error showed) and the UI reflects the saved data after redirect/revalidation.
- Editing an existing record and re-saving works, including clearing optional fields back to empty/null.
- Invalid input produces a clear inline error without losing the user's other entered values, never a silent failure or unhandled exception.
- The save works under the role that actually uses the form (RLS policies must permit it — test with real role sessions, not just the service key).
- New custom dropdowns and the client picker (from Prompt 3) submit their values correctly inside these forms.

**Method.** Prefer automated verification: use the existing test setup if present, otherwise script the checks (e.g. Playwright against a local dev server with seeded test data, and/or direct server-action invocation with Supabase state assertions). Every bug found gets a root-cause fix, then re-run the failing check to confirm.

**Deliverable.** A QA report: table of every save flow tested, pass/fail on first run, what was broken, and what was fixed. Typecheck, lint, and build must pass after all fixes. Do not change intended behavior while fixing — only make saves work as designed.
