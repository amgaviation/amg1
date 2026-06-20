# Quote and Invoice Audit Controls

Implemented controls:

- Existing quote/invoice actions continue to write portal `audit_events`.
- Quote approval now requires a quote terms and operational review acknowledgment.
- Quote approval records `quote_terms_acknowledged` and `quote_approved` in `compliance_evidence_events`.
- Billing document downloads record `document_downloaded` or `sensitive_document_viewed`.
- Invoice PDF download records `invoice_viewed` evidence.
- Client invoice pages state that AMG does not process payment card or bank account payments through the portal.

Known follow-up:

- Add explicit evidence events for every admin quote/invoice edit/send action if counsel requires a separate evidence table beyond existing `audit_events`.
