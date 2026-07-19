# FlightWall Bridge API

`GET /api/flightwall/summary` — read-only ops summary consumed by the AMG
FlightWall LED wall display (ESP32, polls every ~45 s).

- **Auth:** `Authorization: Bearer ${FLIGHTWALL_API_TOKEN}` (shared secret env
  var, constant-time compare; endpoint returns 401 for everything while the
  var is unset). Same shared-secret pattern as the email status webhook.
- **Sources:** `missions` (intake statuses = new requests; quoted →
  in_progress = active board), `public_support_requests` + `profiles` for
  requester names, `contact_form_submissions` (recent 3 + a `cursor` = max
  `created_at` of `status='new'` rows, so the device can detect new arrivals),
  `payments` + `subscription_billing_invoices` for revenue (no live Stripe
  calls; failed/void/refunded excluded).
- **Semantics:** revenue is reported in **cents** (`today_cents`, `mtd_cents`,
  day boundaries in America/New_York); names are first name + last initial
  only and all labels are truncated to 24 chars server-side (privacy — this
  feed renders on a wall).
- **Resilience:** responses cached in-memory for 30 s; each section is
  independently try/caught, so a failing table yields `null` for that section
  instead of a 500.
- **Contract:** the full device-side response shape lives in the FlightWall
  repo at `docs/platform-design.md` ("amg1 bridge" section).

Smoke test once `FLIGHTWALL_API_TOKEN` is set:

```sh
curl -H "Authorization: Bearer $FLIGHTWALL_API_TOKEN" \
  https://www.amgaviationgroup.com/api/flightwall/summary
```
