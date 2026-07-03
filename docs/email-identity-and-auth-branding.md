# AMG Email Identity and Auth Branding

This repository now centralizes outbound email identity in `lib/email/config.ts`.
Code-side configuration can ensure application-sent email uses AMG sender
identity, AMG reply-to identity, AMG-branded HTML, and AMG-owned auth redirect
URLs. Supabase dashboard email sender settings and hosted Auth email templates
must still be configured manually before production launch.

## Required Sender Addresses

- AMG Aviation Group: `notify@amgaviationgroup.com`
- AMG Operations: `operations@amgaviationgroup.com`
- Reply-to / contact: `information@amgaviationgroup.com`

All external email should show either `AMG Aviation Group` or `AMG Operations`
as the sender display name.

## Required Environment Variables

Set these in production. Do not prefix secrets with `NEXT_PUBLIC_`.

```bash
RESEND_API_KEY=
AMG_EMAIL_FROM="AMG Aviation Group <notify@amgaviationgroup.com>"
AMG_OPERATIONS_FROM="AMG Operations <operations@amgaviationgroup.com>"
AMG_REPLY_TO="information@amgaviationgroup.com"
NEXT_PUBLIC_SITE_URL="https://www.amgaviationgroup.com"
NEXT_PUBLIC_PORTAL_URL="https://www.amgaviationgroup.com"
```

Legacy `EMAIL_DEFAULT_FROM`, `EMAIL_OPS_FROM`, `EMAIL_FROM_ADDRESS`,
`RESEND_FROM_EMAIL`, and `EMAIL_REPLY_TO` are still read as fallback values, but
new configuration should use the AMG-prefixed variables above.

## Resend Domain Verification

In Resend, verify `amgaviationgroup.com` before sending production email from
AMG addresses. Add the DNS records Resend provides for SPF, DKIM, and MX or
return-path handling. Do not use `onboarding@resend.dev` in production.

## Supabase Dashboard Checklist

These settings cannot be changed safely from this repo. Confirm them in the
Supabase dashboard before production launch.

### Authentication > URL Configuration

- Site URL: `https://www.amgaviationgroup.com`
- Redirect URLs should include:
  - `https://www.amgaviationgroup.com/auth/callback`
  - `https://www.amgaviationgroup.com/auth/confirm`
  - `https://www.amgaviationgroup.com/auth/password-setup`
  - `https://www.amgaviationgroup.com/auth/invite`
  - `https://www.amgaviationgroup.com/auth/confirmed`
  - `https://www.amgaviationgroup.com/auth/verify-email`
  - `https://www.amgaviationgroup.com/portal-setup`
  - `https://www.amgaviationgroup.com/reset-password`
- Only keep localhost or preview URLs while actively testing non-production
  environments.

### Authentication > SMTP Settings

- Enable custom SMTP if Supabase Auth sends any confirmation, invite, password
  reset, or email-change email.
- Sender name: `AMG Aviation Group` or `AMG Operations`
- Sender email: an AMG-controlled address, preferably
  `notify@amgaviationgroup.com`
- Reply-to: `information@amgaviationgroup.com`

### Authentication > Email Templates

Replace default provider copy with AMG-branded copy. The email must not mention
Supabase, provider internals, tokens, OTPs, magic links, JWTs, or raw technical
URLs. Button text should use plain operational language:

- Email confirmation: `Verify AMG Connect access`
- Password reset: `Reset AMG Connect password`
- Invite/account setup: `Set up AMG Connect access`
- Email change: `Confirm AMG Connect email`

All button URLs should use the AMG redirect URLs above.

Custom portal setup emails sent by the app should use AMG-owned
`/auth/confirm?token_hash=...&type=recovery` links generated from Supabase
`hashed_token` values. Do not send Supabase `action_link` URLs directly in
client-facing portal setup emails; if redirect allowlists drift, those provider
links can fall back to the Site URL homepage instead of the password setup
flow.

## Auth Routes

Code-side auth redirects now target AMG routes:

- `/auth/callback`
- `/auth/confirm`
- `/auth/password-setup`
- `/auth/invite`
- `/auth/confirmed`
- `/auth/verify-email`
- `/auth/reset-password`
- `/auth/error`

These pages and routes use AMG branding and do not display raw token or code
values.

## Testing Each Email Flow

For each flow below, send to a controlled test mailbox and verify:

- Sender display name is `AMG Aviation Group` or `AMG Operations`.
- Sender email is AMG-controlled.
- Reply-to is `information@amgaviationgroup.com` or an AMG-controlled thread
  alias.
- Subject/body/footer/link text do not mention Supabase or provider internals.
- Buttons point to `https://www.amgaviationgroup.com/...`.
- Expired or invalid auth links show the AMG-branded `/auth/error` page.

Flows to test:

- New account signup / portal access request
- Email verification
- Invite/account setup
- Password reset
- Email change confirmation
- Support request confirmation
- Contact form confirmation
- Quote email
- Invoice email
- Receipt email
- Mission/client update email
- Crew assignment notification
- Vendor/FBO notification if enabled in production workflows

## Rollback Considerations

If delivery fails after enabling custom SMTP or Resend sender addresses, do not
revert to provider-branded sender identities in production. Instead:

1. Temporarily pause outbound external email.
2. Verify DNS, Resend domain status, and SMTP credentials.
3. Confirm Supabase redirect allowlist entries.
4. Re-test with a controlled mailbox.

Keep provider details in internal logs only; never expose them in client, crew,
FBO, vendor, requester, or partner-facing messages.
