# AMG Aviation Group — 14-Day Revenue Launch

> **Superseded in part.** This was written before the market-intelligence research
> completed. `docs/LAUNCH_INTELLIGENCE_BRIEF.md` is the verified version and wins
> wherever the two disagree. The corrections that matter most:
>
> - **The owner pays the pilot directly.** This doc's "pass-throughs at cost with
>   receipts" model made AMG the pilot's paymaster. AMG now invoices one line —
>   its coordination fee — and never handles trip funds. §5 below is wrong on this.
> - **The $495 piston fee is the pricing problem, not the $895 turbine fee.** A
>   $495 fee against a $400–600/day piston ferry pilot is roughly one full pilot
>   day, charged to the most price-sensitive segment in aviation.
> - **The flat fee breaks above two days.** $895 is a 35% take on a one-day ferry
>   and 3.7% on a 14-day coverage, for more work. Day-scale it.
> - **Do not lead with 14 CFR 119.1(e)(3)** in sales calls. It is an exception from
>   certification, not an authorization to carry persons or property for
>   compensation. §1 of the brief explains why reciting it invites the question
>   that breaks it.
> - **`/for-shops` and `/pilots` carried live claims worse than anything in §7
>   below.** Both are fixed; see the brief's closing table.

Operating plan. Objective: **$5,000–$10,000 collected within 14 days**, from work AMG can legally
sell today, without creating regulatory or insurance exposure that ends the company in month three.

Owner: Antonio "Tony" Gonzalez. Everything below assumes the founder personally sells and
personally fulfils. Nothing here depends on the portal.

---

## 1. The read

The strategy already in place is directionally right and I am not relitigating it. Narrow offer,
manual fulfilment, founder-led outbound, no subscriptions, no portal in the pitch. That is correct.

Four things in the current plan are wrong or missing, and each one costs money.

### 1.1 The published day-rate band is too low for jets

`lib/site-config.ts` publishes `Turboprop & light jet — $1,000–1,600/day`. The 2026 market for
light-jet contract captains (Citation CJ series, Phenom 300, Learjet 45) is roughly
**$1,500–$1,850/day**. Piston at $500–800 is defensible.

Consequence: quote a CJ3 ferry off the published band, then discover the only available current,
insurable CJ3 captain wants $1,750, and AMG either eats the difference or reprices in front of the
customer. Both are bad, and the second is worse.

Fix: split the published band — turboprop separate from light jet — and reprice before the first
jet quote goes out. Republish quarterly as the page already claims. **Verify against two live
sources before publishing new numbers.** (Rate data above: CrewBlast and The Professional Pilot
Network, 2026. Treat as directional, confirm with actual pilots in the network.)

### 1.2 Direct-to-owner list building is a decaying asset

FAA Reauthorization Act of 2024 **§803** is implemented. Aircraft owners can now request via CARES
that their name, address, and other PII be withheld from public dissemination on FAA websites.
Combine that with the fact that most turbine aircraft are registered to LLCs and trusts, and
"download the registry, mail the owners" is a weakening play that gets worse every month.

Consequence: the channel that survives is **the people who already stand between AMG and the
owner** — independent maintenance shops, avionics shops, brokers, and insurance brokers. They know
who owns what, they talk to owners weekly, and their contact details are public and stable.

This is not a small reprioritisation. It means partner outreach is the primary motion, not a
secondary one.

### 1.3 The website prices nothing

Until the change in this branch, `/pricing` was titled "Starting Coordination Fees" and every row
read "Scope reviewed." A pricing page with no prices reads as either *expensive* or *not a real
company*. Both kill the lead before the phone rings. Fixed — see §7.

### 1.4 There is no founder on the founder's website

`TEAM_ROSTER` in `lib/site-config.ts` ships with `credentials: null` and `photo: null`. For an
aviation service company whose entire product is the founder's judgement, that is the single
biggest credibility hole on the site. A DOM checking AMG out before returning a call finds a name
and a paragraph.

**This is the highest-value 20 minutes available.** It requires two things only the founder has:
certificates and a photograph.

---

## 2. On "deception to get customers"

Handled plainly, once.

Do not fabricate credentials, network size, mission history, testimonials, response times, or
availability. Not because it is distasteful — because in this specific industry it is the failure
mode that ends companies:

- **Insurance.** Material misrepresentation is grounds for rescission. A policy rescinded *after* a
  claim means personal exposure on an aviation loss. That is a life-altering number.
- **The FTC's Rule on Consumer Reviews and Testimonials** (effective 2024) attaches civil penalties
  per violation to fabricated reviews and testimonials. Florida's Deceptive and Unfair Trade
  Practices Act adds a state cause of action.
- **The industry is tiny.** Florida Part 91 turbine is a few thousand people who all talk. One DOM
  discovering an invented type rating ends the referral channel permanently.

What actually works fast, and is completely legitimate:

| Asset | Cost | Time | Why it moves a skeptic |
|---|---|---|---|
| Certificate of Insurance naming the shop/owner | policy cost | days | The single most-requested document. A shop that gets a COI treats you as a vendor, not a stranger. |
| Founder credentials + photo on `/team` | $0 | 20 min | Answers "who is this person" before they have to ask |
| Real, answered phone number | already have | 0 | Most competitors go to voicemail |
| Published prices | $0 | done | Only real businesses publish numbers |
| One completed job, documented | at cost | week 1 | Converts to the first reference |
| 3 named references from pilots/shops he already knows | $0 | 1 hour of calls | Borrowed trust is still trust |
| Google Business Profile, verified | $0 | 30 min | Shows up when someone searches the company name after a call |

Legitimate pressure that is not deception: **real** scarcity (his own calendar is genuinely
finite), specificity, risk reversal (refund the coordination fee if AMG can't source crew), and
doing job one at cost to earn the reference. Use all four.

---

## 3. The single highest-probability first sale

Not an owner. Not a flight department. **An independent maintenance shop's customer who needs the
aircraft moved.**

Reasoning: the shop already has the problem in front of them, it is not their core business, they
have no incentive to keep it, the customer is already spending money, and the shop's contact
details are public. The owner is hard to find (§1.2). The shop is not.

Target profile — deliberately narrow:

- Standalone Part 145 or independent maintenance/avionics shop
- Owner-operated or small management team
- Piston, turboprop, or light jet
- **Not** FBO-integrated, not charter-affiliated, no large corporate parent
- Direct relationships with aircraft owners

The prior research already produced a validated starting list. Best three verified contacts:
`rick@eastcoastaviationservice.com` (East Coast Aviation Service, Stuart — owner),
`wkstephens@americanaviation.us` (American Aviation, Brooksville — VP/DOM),
`info@aircraftturbineworks.com` (Aircraft Turbine Works, Fort Pierce).

Do not blast these. Three shops, three phone calls, three personal emails.

---

## 4. Fourteen days

Working assumption: the founder has roughly 4 focused hours a day around flying.

### Days 1–2 — Become transactable

Nothing here is optional. Until all of it is true, outbound is wasted.

1. **Confirm the entity and the bank account.** LLC active, EIN, business checking.
2. **Insurance.** Call a Florida aviation broker today and describe the business *accurately*:
   coordination and crew sourcing for owner-controlled Part 91 aircraft, no operational control, no
   aircraft owned or operated. Ask for general liability plus non-owned aircraft liability plus
   professional liability/E&O, and ask what limits shops and owners typically require on a COI.
   **This is the long pole. Start it on day one.**
3. **One-page engagement agreement**, reviewed by aviation counsel. Must contain: scope, the
   coordination fee, pass-throughs at cost, who pays positioning/lodging/per diem, cancellation and
   weather, an explicit no-operational-control clause, insurance naming, limitation of liability.
   Counsel review of one page is cheap. Skipping it is not.
4. **Stripe live.** `STRIPE_SECRET_KEY=sk_live_...` and the live webhook secret in Vercel
   Production. Verify with `npm run stripe:live-readiness:verify`. Invoice line item reads
   **"Coordination fee"** — never "flight," "trip," "charter," or "booking."
5. **Founder credentials and photo** into `TEAM_ROSTER`. Certificates held, ratings, total time,
   types. Real headshot.
6. **Google Business Profile** created and verified.

### Days 3–4 — Build the list

Target: **150 named contacts with a real human name attached.** Not 500 generic inboxes.

| Segment | Target | Where it comes from |
|---|---|---|
| Independent FL maintenance/avionics shops | 50 | FAA Part 145 repair station database filtered to FL, cross-checked against airport tenant directories at KFXE, KOPF, KPBI, KBCT, KSUA, KAPF, KSRQ, KTMB, KTPA, KORL. Exclude FBO-integrated and component-only shops. |
| Aircraft brokers/dealers | 30 | IADA and NARA member directories, Controller.com and Trade-A-Plane FL dealer listings |
| Aviation insurance brokers in FL | 20 | These are the highest-leverage contacts on the list — they hear "my policy needs a second pilot" before anyone else |
| Corporate flight departments | 25 | Airport tenant lists, NBAA member directory |
| Contract pilots (supply side) | 25 | The founder's own network first |

Rules that keep the domain alive: verify every address, send from Google Workspace, keep to
**under 30 sends a day for the first week**, use mail merge (individual threads, not BCC), include
a physical address and an opt-out per CAN-SPAM, and never buy a list.

**Supply side matters as much as demand.** Selling a ferry with no pilot to fly it is worse than
not selling it. Build the pilot bench in parallel — the `/pilots` page already promises payment in
7 days, which is a genuine differentiator against the industry's net-30/60 norm. It only works if
he can actually fund it. Confirm that before promoting it.

### Days 5–12 — Outbound

Daily, every weekday:

- **15 phone calls** — shops and brokers, by name, before 11am
- **20 personalised emails** — one segment per day, never the same template twice in a row
- **2 in-person stops** — this is the unfair advantage. He is in South Florida with a car and a
  pilot certificate. Walking into a shop at KFXE or KTMB and talking to the DOM converts at a rate
  no email touches. Two ramp visits a day beats 200 more emails.
- **All follow-ups from the prior day**

The call has one job: find out whether the shop encounters the problem, and who owns it. Not to
close a partnership.

> "Hi, this is Tony Gonzalez with AMG Aviation Group. I'm a Florida-based corporate pilot. I'm
> calling because shops get asked to help customers find someone to fly the aircraft in, or take it
> home after the work's signed off. We coordinate that for owner-controlled Part 91 aircraft. Who
> handles it there when a customer asks?"

Every conversation ends with the same close, and it is not "if you ever need us":

> "Do you have anything in the next two weeks where a customer needs the aircraft moved?"

### Days 13–14 — Close and document

Convert proposals. Deliver manually — phone, email, e-sign, invoice. Then produce a one-page,
non-identifying closeout note for every completed job. That note is the first case study and the
raw material for the second sale.

---

## 5. Money mechanics

- **Coordination fee is due at acceptance, not on completion.** As a new vendor AMG has no standing
  to extend terms, and does not need to. The fee is small relative to the problem.
- **Pass-throughs at cost, receipts attached, no markup.** This is already the public promise and it
  is a good one — it removes the "middleman is skimming" objection entirely. Honour it exactly.
- **Never front the pilot's day rate out of AMG's pocket** on the first jobs. Collect from the owner
  first, then pay. Reverse that only once there is working capital.
- **Stripe invoice or ACH.** Avoid net-30 language anywhere.

Path to $8k in 14 days, realistically:

| Work | Fee | Count | Total |
|---|---:|---:|---:|
| Maintenance ferry coordination (piston/turboprop) | $495 | 3 | $1,485 |
| Light jet ferry or crew coverage | $895 | 2 | $1,790 |
| Multi-day contract pilot coverage | $1,500–2,500 | 2 | $4,000 |
| **Gross** | | | **~$7,275** |

That requires roughly **50 real conversations** to produce 7 paid jobs. If 50 conversations produce
zero, the problem is the offer or the audience — not the volume. Narrow further; do not add
features.

---

## 6. What actually kills this

1. **Selling a job with no pilot behind it.** Supply-side bench must grow alongside demand.
2. **The insurance gap.** Taking money before the COI exists. One incident ends everything.
3. **Drifting into operational control.** The moment AMG selects the pilot *and* controls the
   aircraft *and* prices the flight as a package, it starts to look like an air carrier holding out
   without a certificate. Keep the owner selecting the pilot. Keep the fee separate from the flight.
   Keep the language clean: coordination, sourcing, support — never dispatch, booking, charter, or
   "we'll get you there."
4. **Founder capacity.** Every job is currently 100% founder time. Three concurrent missions is the
   ceiling before quality drops.
5. **Burning the domain on day one.** 500 cold emails from a fresh domain lands AMG in spam
   permanently. Ramp slowly.

---

## 7. Software changes

### Shipped in this branch

| Change | File | Why |
|---|---|---|
| Published real starting fees ($495 piston / $895 turboprop & light jet), pass-through day-rate bands, and the scope disclaimer | `app/(public)/pricing/page.tsx`, `lib/site-config.ts` (`COORDINATION_FEES`) | The page was titled "Starting Coordination Fees" and priced nothing |
| Phone tap target on the nav bar at every breakpoint | `components/site/site-nav.tsx`, `components/site/tracked-link.tsx` | The number was hidden below 1024px and buried behind the hamburger — the urgent caller was the one who couldn't find it |
| "Need it handled today?" call-first card on the request page | `app/(public)/request/page.tsx` | Gives the AOG case a one-tap exit to a human instead of a 12-field form |
| Aircraft type and dates no longer required on intake | `app/(public)/request/quote-request-form.tsx` | Server only requires name, email, acknowledgement. Six required fields turned away people who did not yet have the full picture |
| Removed "US based · worldwide coordination" | `components/flightdeck/ticker.tsx` | Unsubstantiated. Service area is Florida and the Southeast |

### Next, in priority order

1. **Founder credentials + photo** in `TEAM_ROSTER` (`lib/site-config.ts`). Blocked on the founder.
   Highest credibility return of anything on this list.
2. **SMS alert to the founder on every new support request.** Twilio is already wired
   (`lib/portal/notification-delivery.ts` → `sendSms`), but public form submissions currently only
   write to Supabase and email `information@`. A 9pm request that sits unread until morning is a
   lost job. Wire `saveAndEmailSubmission` to fire an SMS.
3. **Verify the `AFFILIATIONS` claim** (`AOPA Member`) is a current membership before it stays on
   the site.
4. **Split the published day-rate band** — turboprop and light jet are not one number (§1.1).
5. **Delete the dead subscription surface.** `components/site/fare-board.tsx` and
   `components/site/worked-example.tsx` import `PLAN_TABLE`/`WORKED_EXAMPLE` but are not rendered by
   any page. They are a trap — someone will re-mount them and republish subscription pricing that
   was deliberately retired.
6. **Publish the street address** (`SITE.streetAddress` is still a `TODO`) — required for CAN-SPAM
   footers and for Google Business Profile.
7. **`schema.org/ProfessionalService` markup** with phone, address, and area served.

### Portal

Leave AMG Connect closed. It is not needed for any of the first $10k, and the documented
authorization defects are a liability that outbound cannot outrun. Revisit only after the
operating process is proven manually — no earlier than month 5 of the gated rollout.

Track prospects in a spreadsheet for now. 150 contacts does not justify a CRM, and building one is
the most seductive way to avoid making calls.
