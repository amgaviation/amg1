# Secure Engineering Standard

AMG Aviation code changes must be secure by default. Treat security requirements as acceptance criteria for every route, action, component, database query, upload, download, email, and integration.

## Required Controls

- Validate all user-controlled input on the server before writes, provider calls, file operations, redirects, or privileged actions.
- Use parameterized queries, Supabase query builders, or existing typed helpers. Do not concatenate unchecked input into SQL or dynamic filters.
- Enforce authentication and authorization server-side for every portal action and protected route.
- Pick allowed fields explicitly for creates and updates. Do not allow mass assignment of role, status, account, ownership, billing, or approval fields.
- Return safe user-facing errors. Log technical failures server-side with safe context and no secrets.
- Keep service-role credentials server-only and never expose secrets through `NEXT_PUBLIC_*`.
- Store private files in private storage and serve them only after authorization through signed URLs or controlled download routes.
- Record audit or compliance evidence for sensitive actions such as role changes, document access, billing actions, support requests, and privacy choices.
- Prevent online collection of card, CVV, bank-account, routing, or other payment-instrument details outside approved payment workflows.
- Gate analytics and nonessential scripts behind cookie consent.
- Do not weaken existing authentication, RLS, or portal role checks to make a feature work.

## Review Checklist

Before completion, verify:

- Inputs are validated for type, length, format, enum values, and required fields.
- Database reads and writes are least-privileged and record-specific.
- User-facing errors do not expose provider, database, stack, path, or environment details.
- Logs omit secrets, tokens, passwords, payment data, and sensitive document contents.
- Redirects are internal or allowlisted.
- Public endpoints have abuse protections or a documented follow-up.
- Relevant checks run successfully: `npm run typecheck`, `npm run compliance:check`, and build/test commands when the change warrants them.

## Prohibitions

Never hardcode secrets, expose service-role keys to the browser, return raw `error.message` to public users, trust client-side validation alone, render unsanitized user HTML, allow wildcard CORS with credentials, create open redirects, store full card numbers or CVV, expose private files through public URLs, or claim a feature is secure without verification.
