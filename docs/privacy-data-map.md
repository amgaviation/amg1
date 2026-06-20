# Privacy Data Map

Status: attorney-review draft implementation notes.

## Public Forms

Sources: contact inquiry, request support.

Data: name, email, phone, company or operator, preferred contact method, inquiry or support type, aircraft details, route or timing details, message, acknowledgement, optional marketing consent, optional SMS consent, source URL, referrer, user agent, raw form payload.

Purpose: inquiry routing, support review, operational administration, confirmation email, internal notification, audit.

Storage: `contact_form_submissions`, `marketing_consents`.

## Privacy Choices

Source: `/privacy-choices`.

Data: name, email, phone, relationship, request type, request details, source URL, user agent, status, notes.

Purpose: privacy request intake, verification, response tracking, compliance audit.

Storage: `privacy_requests`.

## Cookie Consent

Source: cookie banner and footer preference control.

Data: consent version, categories, source, page path, user agent, GPC flag, timestamp. Browser-local preference is stored in local storage.

Purpose: script gating, consent audit, preference persistence.

Storage: local storage key `amg_cookie_consent_v20260620`, optional server table `consent_events`.

## Portal Documents

Sources: client documents, partner documents, admin documents, crew credentials, crew expenses.

Data: document name, type, expiration, storage path, visibility, scope, uploader, review status, notes, and uploaded file.

Purpose: aircraft support review, credential review, partner review, billing or expense review, operational administration.

Storage: portal document tables and Supabase storage buckets.

## Excluded Payment Data

The current website and portal do not process direct public payments and must not store full card numbers, CVV codes, raw bank account numbers, or raw ACH details.
