# AMG Public Redesign Form Parity Audit

Date: 2026-06-21

## Summary

No public form server action, endpoint contract, validation normalization, consent field, honeypot, redirect, storage behavior, email behavior, or Supabase auth behavior was changed in this branch.

## Public Forms

| Route | Component | Fields / controls | Validation / handler | Success | Error | Query params | Legal / consent | Treatment |
|---|---|---|---|---|---|---|---|---|
| `/contact` | `components/site/contact-inquiry-form.tsx` | `full_name`, `email`, `phone`, `company_operator`, `preferred_contact_method`, `inquiry_type`, `message`, `acknowledgment`, `marketing_consent`, `sms_consent`, `website` honeypot | `submitContactInquiry` -> `normalizeContactSubmission` -> `saveAndEmailSubmission` | `/contact?success=1` | `missing`, `payment-data`, safe error | `success`, `error` | Privacy Policy, Terms, Email Communications Notice, SMS Terms | Unchanged |
| `/request-support` | `components/site/support-request-form.tsx` | Requester, aircraft, support path, conditional support fields, timing, acknowledgment, optional marketing/SMS consent, `website` honeypot | `submitSupportRequest` -> `normalizeSupportSubmission` -> `saveAndEmailSubmission` | `/request-support?success=1` | `missing`, `payment-data`, safe error | `success`, `error`, `category`, `service`, `plan` | Privacy Policy, Terms, Mission Acceptance Disclaimer, SMS Terms | Unchanged |
| `/privacy-choices` | `app/(public)/privacy-choices/page.tsx` | Privacy request type and relationship fields | `privacy-choices/actions.ts` | Existing success response | Existing error response | Existing page params | Compliance evidence | Unchanged |
| `/portal-setup` | `PortalSetupForm` | `secret_one`, `secret_two`, Supabase token/hash/code handling | Supabase `updateUser` and `/api/portal-setup/complete` | `/login?success=password-reset` | mismatch, weak, invalid, failed | `code`, auth hash tokens | Auth setup flow | Unchanged |
| `/login` | `PortalLogin` | Login and request-access controls | Supabase auth / existing portal access logic | Role-routed portal destination | Existing login errors | `mode`, `success` | Existing auth copy | Unchanged |
| `/forgot-password` | Existing auth form | Email | Existing action | Existing reset flow | Existing error | Existing params | Existing auth copy | Unchanged |
| `/reset-password` | Existing auth form | Password fields | Existing action | Existing login redirect | Existing error | Existing params | Existing auth copy | Unchanged |

## Protected Submission Boundaries

Automated QA must not submit production customer, crew, aircraft registration, route, pricing, document, card, bank, passenger, or credential data. Public form validation can be tested by triggering browser-native required-field validation and by inspecting fields/actions without submitting live requests.

## Preserved Contracts

- `submitContactInquiry(formData)`
- `submitSupportRequest(formData)`
- Hidden honeypot field: `website`
- Payment data guard redirects
- Required acknowledgment checkboxes
- Optional marketing and SMS consent checkboxes
- Existing email/submission storage path through `saveAndEmailSubmission`
- Existing redirect success/error semantics
