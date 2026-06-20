# Compliance Hardening Manual QA

- Evidence events: submit contact/support/privacy/cookie actions and verify `compliance_evidence_events`.
- Support request disclaimer: public and portal support forms require acknowledgment.
- Payment guard: use safe fake card `4111111111111111`; submission should be blocked and the value should not appear in logs.
- Document classification: upload a document and verify category/access metadata and evidence events.
- Sensitive file access: download a credential or billing document and verify sensitive access evidence.
- Quote/invoice audit: approve a quote and download an invoice PDF; verify evidence events.
- Role-access smoke test: confirm client cannot view another client’s quote/document URL.
- MFA/admin review: open `/portal/admin/security-review`, review warning, complete review, verify evidence.
- Prohibited copy audit: run `npm run compliance:check`.
- Asset/vendor reviews: review `docs/media-review-checklist.md` and `docs/vendor-subprocessor-inventory.md`.
- International/no-emergency disclaimer: confirm public and portal support flows show the notice.
- Launch checklist: complete `docs/launch-compliance-checklist.md`.
