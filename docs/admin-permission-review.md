# Admin Permission Review Procedure

Monthly or before a sensitive production launch:

- Open `/portal/admin/security-review`.
- Review all approved admin users.
- Confirm suspended and pending users should remain in that state.
- Confirm no stale admin accounts remain approved.
- Confirm billing/document/role-management access is still needed.
- Confirm MFA enforcement status with Supabase Auth.
- Add review notes and mark the review completed.
- Investigate and document any role changes separately.

The completion action records `admin_access_review_completed` in `compliance_evidence_events`.
