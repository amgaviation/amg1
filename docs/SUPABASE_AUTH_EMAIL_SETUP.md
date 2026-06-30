# Supabase Auth Email Setup

The AMG Connect sender address cannot be changed from Next.js application code.
Supabase Auth owns confirmation email delivery, including SMTP host, port,
credentials, sender email, and sender name. The app controls the redirect and
verification form experience; Supabase must be configured to send branded OTP
emails through AMG's custom SMTP sender.

## A. Configure SMTP

Supabase Dashboard > Project > Authentication > Settings > SMTP Settings /
Custom SMTP.

Set:

- Enable custom SMTP: true
- Sender email / admin email: `information@amgaviationgroup.com`
- Sender name: `AMG Aviation Group`
- SMTP host: provided by the email service
- SMTP port: usually `587`
- SMTP user: provided by the email service
- SMTP password: provided by the email service
- Email confirmations enabled
- Auto-confirm disabled

Do not expose SMTP credentials, Supabase service-role keys, or Management API
tokens to browser code.

## B. DNS Requirements

Before production use, the email service and `amgaviationgroup.com` domain must
have SPF, DKIM, and DMARC configured and passing. This protects deliverability,
reduces spoofing risk, and supports SOC2-style evidence for controlled
transactional email.

## C. Redirect URL Settings

Supabase Dashboard > Authentication > URL Configuration.

Set Site URL to:

```text
https://amgaviationgroup.com
```

Add redirect URLs:

```text
https://amgaviationgroup.com/verify-email
https://www.amgaviationgroup.com/verify-email
http://localhost:3000/verify-email
```

If Vercel preview deployments are used, document the exact preview URL pattern
separately. Do not use broad wildcards in production unless there is a clear
operational requirement and compensating monitoring.

## D. Confirm Signup Email Template

Supabase Dashboard > Authentication > Email Templates > Confirm signup.

Subject:

```text
Verify your AMG Connect email
```

HTML template:

```html
<div style="margin:0;padding:0;background:#050B14;color:#FFFFFF;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="border:1px solid rgba(192,199,209,0.18);background:#07111F;border-radius:20px;padding:32px;box-shadow:0 24px 70px rgba(0,0,0,0.34);">
      <p style="margin:0 0 12px;color:#3B82F6;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;">
        AMG Connect Verification
      </p>
      <h1 style="margin:0 0 16px;color:#FFFFFF;font-size:30px;line-height:1.18;font-weight:700;">
        Verify your AMG Connect email
      </h1>
      <p style="margin:0 0 20px;color:#C0C7D1;font-size:15px;line-height:1.6;">
        Use the verification code below to verify your AMG Connect account.
      </p>
      <div style="margin:28px 0;padding:24px 22px;border-radius:16px;background:#050B14;border:1px solid rgba(59,130,246,0.48);text-align:center;">
        <div style="color:#9CA3AF;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:10px;font-weight:700;">
          Verification code
        </div>
        <div style="color:#FFFFFF;font-family:'SFMono-Regular','Roboto Mono','Courier New',monospace;font-size:38px;line-height:1.1;letter-spacing:0.24em;font-weight:800;">
          {{ .Token }}
        </div>
      </div>
      <p style="margin:0 0 22px;color:#C0C7D1;font-size:14px;line-height:1.6;">
        Enter this code on the AMG verification page.
      </p>
      <a href="{{ .RedirectTo }}"
         style="display:inline-block;background:#3B82F6;color:#FFFFFF;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        Open verification page
      </a>
      <p style="margin:28px 0 0;color:#9CA3AF;font-size:12px;line-height:1.6;">
        If you did not request AMG Connect access, you can ignore this email.
      </p>
    </div>
    <p style="margin:18px 0 0;color:#9CA3AF;font-size:11px;text-align:center;">
      AMG Aviation Group
    </p>
  </div>
</div>
```

Do not use `{{ .ConfirmationURL }}` in this template for signup confirmation.
Use the OTP code `{{ .Token }}` and the AMG website form. `{{ .RedirectTo }}`
must point users to `/verify-email` or `/verify-email?email={{ .Email }}`.
The button must never use a confirmation URL, magic link, token hash, or any
URL that automatically verifies or consumes the token.

## Optional Management API Curl

Use this only from a secure local shell or CI environment with protected
secrets. Confirm exact API fields against the Supabase Management API before
running in production, because SMTP and template payloads can change by API
version.

```bash
curl --request PATCH \
  "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  --header "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  --header "Content-Type: application/json" \
  --data "$(jq -n \
    --arg host "$SMTP_HOST" \
    --arg port "$SMTP_PORT" \
    --arg user "$SMTP_USER" \
    --arg pass "$SMTP_PASS" \
    '{
      external_email_enabled: true,
      mailer_autoconfirm: false,
      smtp_admin_email: "information@amgaviationgroup.com",
      smtp_sender_name: "AMG Aviation Group",
      smtp_host: $host,
      smtp_port: ($port | tonumber),
      smtp_user: $user,
      smtp_pass: $pass
    }')"
```

Required environment variables:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
