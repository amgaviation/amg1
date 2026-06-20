# Vendor and Subprocessor Inventory

Status: needs business/security review.

| Provider | Category | Purpose | Data shared | Sensitive data | International transfer | DPA required | DPA status | Security review | Contract status | Owner | Review date | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Vercel | hosting/deployment | Website and portal hosting | App data in runtime/logs | Possible | Unknown | Needs review | Unknown | Needs review | Unknown | AMG | TBD | Confirm project configuration and log retention. |
| Supabase | database/storage/auth | Auth, database, storage | Portal, documents, audit data | Yes | Unknown | Needs review | Unknown | Needs review | Unknown | AMG | TBD | Confirm RLS, storage buckets, backups, and Auth MFA. |
| Resend or configured email provider | transactional email | Notifications and form emails | Names, emails, message content | Possible | Unknown | Needs review | Unknown | Needs review | Unknown | AMG | TBD | Confirm provider in env and retention. |
| Analytics providers | analytics | Optional analytics | Browser/device events | Possible | Unknown | Needs review | Unknown | Needs review | Unknown | AMG | TBD | Must be gated by consent. |
| Marketing pixels | marketing | Optional retargeting | Browser/device events | Possible | Unknown | Needs review | Unknown | Needs review | Unknown | AMG | TBD | Must be gated by consent and consent basis. |
| Higgsfield / AI image tools | AI/image generation | Generated marketing assets | Prompts/assets | Unknown | Unknown | Needs review | Unknown | Needs review | Unknown | AMG | TBD | Do not include client-specific confidential data in prompts. |
