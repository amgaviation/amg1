# Incident Response Notes

Status: operational draft.

## Intake

Potential privacy, security, document, account, credential, or communications incidents should be routed to AMG operations leadership and recorded internally with date, reporter, affected system, affected data categories, preliminary severity, and containment actions.

## Initial Actions

- Preserve logs and relevant audit events.
- Disable affected credentials, sessions, integrations, or access if needed.
- Confirm whether uploaded documents, portal records, credentials, messages, or personal information were involved.
- Avoid sending sensitive details through unsecured channels.
- Escalate to counsel or technical support when legal notice, regulator notice, or customer notice may be required.

## Follow-up

Record the root cause, remediation steps, affected records, notifications, and any changes to RLS policies, storage rules, forms, or portal controls.

## Operational Checklists

- Admin account compromise: suspend affected account, review audit/evidence events, rotate affected credentials, require password reset, review role changes.
- Supabase key rotation: rotate service-role and anon keys in Supabase, update Vercel env vars, redeploy, verify server-only imports.
- Vercel env rotation: update production/preview env vars, redeploy, invalidate compromised values, preserve timeline.
- Email provider key rotation: rotate API keys, verify sending domains, review failed-send logs.
- Storage exposure: review bucket policies, signed URL routes, document access evidence, and affected storage paths.
- Document exposure: identify affected records, users, categories, download logs, and access evidence.
- Evidence preservation: export relevant audit/evidence rows, deployment IDs, request IDs, and timeline notes for counsel review.

Do not send automatic breach notifications from the app. Notification duties and wording require counsel review.
