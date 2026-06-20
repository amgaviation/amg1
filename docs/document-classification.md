# Document Classification

The hardening migration adds document metadata fields:

- `compliance_category`
- `access_level`
- `policy_version`
- `terms_acknowledged_at`
- `archived_at`

Required categories are defined in `lib/compliance/config.ts`. Sensitive categories include pilot medicals, pilot certificates, payment authorization forms, W-9s, contracts, aircraft documents, maintenance records, inspection records, and billing documents.

Document upload flows now require acknowledgment of upload terms and record `document_terms_acknowledged` plus `document_uploaded` evidence. Download routes record `document_downloaded` or `sensitive_document_viewed` after authorization succeeds.

Storage paths remain server-side and are not exposed directly in portal UI.
