# Role Access Matrix

Status: operational hardening draft.

| Role | Can view | Can create | Can edit | Can delete/archive | Can upload/download | Can approve | Can export | Can manage users | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| admin | All portal records needed for operations | Users, aircraft, support requests, documents, quotes, invoices, subscriptions | Broad admin records | Archive/deactivate where flows allow | All authorized records | Users, documents, expenses, workflow decisions | Needs review before sensitive exports | Yes | Requires MFA enforcement before production sensitive workflows. |
| client | Own account, aircraft, support requests, quotes, invoices, documents, messages | Own support requests, messages, document uploads | Own settings/request details where enabled | Limited cancellation/request actions | Own/shared documents and billing PDFs | Own quote response | No broad export | No | Server actions and routes must check client ownership. |
| crew | Own profile, availability, credentials, assignments, expenses, messages | Availability, credentials, expenses, messages | Own crew records where enabled | Own availability windows | Own/shared credentials and assignment docs | Assignment response | No | No | Medical/certificate access is sensitive. |
| partner | Own partner profile, assigned requests, partner documents, messages | Partner responses, documents, messages | Own partner profile and assigned request updates | Limited | Own/shared partner documents | Assigned service milestones where enabled | No | No | Vendor records must remain scoped to assignments/profile. |

Future roles such as billing, document reviewer, crew coordination, and read-only admin should be implemented as explicit role or permission flags before granting partial admin access. Do not rely on hidden UI alone for sensitive access.
