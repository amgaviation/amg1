# Legal Compliance Foundation

Status: attorney-review draft implementation notes.

This build adds the AMG Aviation Group compliance foundation for public website and portal surfaces. The legal pages, consent controls, database tables, public forms, and portal notices are operational scaffolding only and are not legal advice.

## Scope

- Public legal registry in `lib/compliance/legal-pages.ts`.
- Cookie categories and script registry in `lib/compliance/consent.ts`.
- Cookie banner, preferences modal, footer preferences control, and consent-gated script loader.
- Privacy choices and data rights form at `/privacy-choices`.
- Admin compliance dashboard at `/portal/admin/compliance`.
- Supabase migration `20260620070000_legal_compliance_foundation.sql`.
- Upload notices on client, partner, admin, crew credential, and crew receipt upload surfaces.

## Required Review Principle

AMG support is reviewed before acceptance. No request is considered accepted until applicable operational scope, aircraft status, crew availability, owner/operator approval, and operating conditions have been reviewed.

This principle must remain visible in support forms, confirmation email language, legal notices, quote defaults, and operational disclaimers.

## Production Checklist

- Have counsel review all legal notice text before public reliance.
- Deploy the Supabase migration before enabling the privacy choices form in production.
- Confirm PostgREST schema reload after migration.
- Configure optional tracking scripts only through `ConsentScriptLoader`.
- Do not add tracking scripts directly to `app/layout.tsx`, page files, or components.
- Confirm footer legal links and portal legal links route successfully.
- Review uploaded-document storage policies and bucket retention against legal obligations.
