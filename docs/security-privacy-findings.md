# Security and Privacy Findings

## Clear Fixes Added

- Payment-data guard added for public forms, portal support request notes, portal messages, document uploads, credential submissions, crew expense notes, and billing settings.
- Sensitive document/billing downloads now record compliance evidence after authorization succeeds.
- Admin security review page records review completion evidence.
- Invoice page now states no website/portal payment-card or bank-account processing.

## Findings Requiring Follow-up

- Several service-role reads use `.select("*")` in server-only query helpers. They are not client-side service-role use, but field-level minimization should be reviewed later.
- MFA status is not available in profile rows and is not enforced in portal UI. Verify Supabase Auth MFA before production sensitive workflows.
- Last-login data is not exposed in the current profile query. Add Auth admin lookup or a login audit table if needed.
- Content approvals table exists for governance, but no publication workflow UI exists yet.
