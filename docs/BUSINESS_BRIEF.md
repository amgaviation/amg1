# AMG Aviation Group — Business Brief

**Prepared:** July 2026 · **Audience:** anyone who needs to understand the whole
company quickly — a partner shop, an insurance broker, an attorney, a lender, a
first hire, or a serious prospect who asked "so what exactly do you do?"

This is written to investor standards of specificity, but it is not a pitch. It
does not project revenue it has not earned, and it says plainly what is not
built yet. Every number here is traceable to a file in this repository, listed
in Appendix B, so nothing in this document can quietly drift away from what the
business actually does.

---

## 1. The whole thing in ten lines

AMG Aviation Group is a **contract-pilot sourcing and movement coordination
company** serving general aviation aircraft owners in Southeast Florida and the
Southeast US.

An owner has an aircraft and, temporarily, no qualified pilot for it — the
regular pilot called out, the insurance policy demands a second pilot the owner
does not have, or the aircraft needs to physically get to a maintenance shop and
back. AMG finds the right pilot, verifies that pilot actually meets the
requirement the owner's underwriter wrote down, and coordinates the movement.

AMG charges a **coordination fee** — from $495 piston, from $895 turbine — and
that fee is the only money AMG invoices. The pilot's day rate, airline
positioning, per diem, lodging, and fuel are paid by the owner directly to the
pilot and vendors. AMG takes no markup and no vendor rebate.

AMG **never holds operational control**. It is not an air carrier, not a Part
135 certificate holder, and not an air charter broker. The owner and the pilot
in command retain all operational authority. That boundary is the business's
central legal fact and it is engineered into the software, not just the footer.

---

## 2. What AMG is — and what it deliberately is not

### Is
A coordination and sourcing service. AMG's product is **the right pilot,
verified, on time, with the paperwork an underwriter will accept.**

### Is not
> AMG Aviation Group is not an air carrier, commercial operator, air charter
> broker, or Part 135 certificate holder. AMG does not own, provide, lease,
> dispatch, or operate aircraft and never holds operational control as defined
> in 14 CFR 1.1. The aircraft owner and the pilot in command retain all
> operational authority.

That statement is not marketing hedging. It is the difference between a legal
business and an uncertificated air carrier operation, and it is why several
otherwise-attractive arrangements are refused:

| Tempting arrangement | Why it is refused |
|---|---|
| A shop pays AMG to move its customer's aircraft | Money flowing from a non-owner, to move an aircraft they don't own, is the classic uncertificated-carrier fact pattern. **The owner is always AMG's contracting and paying party.** |
| AMG collects the trip funds and pays the pilot | Handling trip funds looks like providing air transportation. Owner pays pilot directly. |
| AMG marks up fuel, lodging, or the pilot's rate | Turns a coordination fee into a resale of air transportation. Zero markup, zero rebates. |
| AMG "dispatches" or releases the flight | Dispatch and release are operational control. AMG coordinates; the PIC releases. |

The statement is reused as the tail of every quote, invoice, and receipt — not
just the website footer — because a claims adjuster or FSDO inspector reads the
paperwork attached to the job, not the site.

---

## 3. The problem, and who has it

General aviation owners hit pilot-availability gaps constantly, and there is no
clean way to solve them:

- **The gap is short.** Two days to three weeks. Hiring is absurd; there is no
  staffing category for it.
- **The requirement is written by an underwriter, not by the owner.** Open pilot
  warranties specify hours, time-in-type, and often a named-pilot endorsement.
  An owner who grabs "a friend with a commercial ticket" may have just voided
  hull coverage on a $2M airframe without knowing it.
- **The search is a phone tree.** Owners ask their shop, who asks an FBO, who
  remembers someone. It takes days and produces one unvetted name.
- **Maintenance ferries are pure friction.** The aircraft must reach the shop and
  come home. It is nobody's job, it delays the squawk being fixed, and it
  strands the owner.

The buyer's actual anxiety is not "can I find a pilot" — it's **"will my
insurance still cover me if I do?"** That is the question AMG is built to answer
in writing.

---

## 4. Customers — four segments, one contracting party

| Segment | What they want | Relationship to AMG |
|---|---|---|
| **Aircraft owners** (piston + turbine, Part 91) | A pilot who meets the policy, this week | **The client.** Signs the agreement, pays AMG. |
| **Maintenance shops / MROs** | Their customers' aircraft to arrive and leave without the shop babysitting logistics | **Referral partner.** Never the contracting party. |
| **Brokers & dealers** | Pre-buy, delivery, and demo flights covered by qualified crew | **Referral partner.** |
| **Contract pilots** | Real work, clear scope, paid by the owner directly | **Supply side.** Apply through `/pilots/apply`, vetted before assignment. |

Note the asymmetry: shops and brokers are the fastest path to volume, but the
owner is always the counterparty. Segment strategy and contracting structure are
deliberately different things.

---

## 5. What is sold, and what it costs

### 5.1 Coordination fees (AMG's revenue)

| Service | Starting fee |
|---|---|
| Temporary contract pilot coverage | Piston from **$495** · Turboprop & light jet from **$895** |
| Maintenance ferry / repositioning coordination | Piston from **$495** · Turboprop & light jet from **$895** |
| Insurance / mentor / second-pilot requirement | From **$495**, priced against the underwriter's written requirement |
| Flight-department overflow | Custom, scoped per department |

"Starting at" is load-bearing. Every engagement is scoped and quoted before
anything is accepted.

### 5.2 The day scale — why a flat fee breaks

A flat fee is structurally broken past two days: $895 is a ~35% take on a
one-day ferry and ~3.7% on a fourteen-day coverage — for materially *more* work.
Locum-tenens staffing and yacht delivery both solved this by billing per day.

- Starting fee covers **days 1–2**
- **+$150/day** piston, **+$250/day** turbine thereafter
- **Soft cap:** AMG's total fee stays under **25–30% of pilot spend**

The cap exists so the fee can never look predatory against what the owner is
already paying the pilot.

### 5.3 Pass-through day rates (AMG never touches this money)

Published benchmarks the **owner pays the pilot directly**, split by mission
rather than aircraft class — a single pilot repositioning an empty airframe is a
different market from a crew flying an owner on a revenue trip:

| Mission | Benchmark |
|---|---|
| Piston — ferry or reposition | $400–600/day |
| Turboprop & light jet — ferry | $700–1,200/day |
| Turboprop — trip & callout | $1,200–2,100/day |
| Light jet — trip & callout | $1,500–2,500/day |

Phenom 300, CJ3+/CJ4, and PC-24 sit above these bands often enough to be quoted
individually.

> **Open item.** These bands are not yet republished. The standard before they
> go live: confirm each against **at least twelve pilots who have given their
> actual number in writing.** Publishing a rate you cannot fill is worse than
> publishing no rate.

### 5.4 What is *not* sold

Subscriptions. A prior tier structure ($149–$649/mo with SLA-credit remedies)
was withdrawn and its code deleted rather than left dormant. AMG does not sell
subscriptions and will not until on-demand demand is proven. If they return, it
is through a fresh decision and a fresh SLA/remedy review.

---

## 6. Unit economics — one real job, end to end

**SR22 maintenance ferry, Tampa → Atlanta.**

| Line | Amount | Paid to |
|---|---|---|
| Contract pilot, 1 day | $600 | Pilot (direct from owner) |
| Airline return positioning | ~$240 | Airline (direct from owner) |
| Per diem | $75 | Pilot (direct from owner) |
| **AMG coordination fee** | **$295** | **AMG — the only line AMG invoices** |
| **Owner's all-in** | **~$1,210** | |

AMG's revenue on this job is $295 against $1,210 of total owner spend — **24%**,
inside the soft cap. Note this example predates the current published fee
schedule and is quoted at a legacy rate; it is retained because it is a real
job, and it is flagged in Appendix C as needing a repricing pass.

**What this means at volume, arithmetically** (not a projection — there is no
trailing revenue to project from):

| Jobs/month | Avg. fee | Monthly revenue |
|---|---|---|
| 4 | $495 | $1,980 |
| 10 | $600 | $6,000 |
| 20 | $700 | $14,000 |

Cost structure is close to pure fixed: hosting, Supabase, Resend, Stripe fees,
insurance, and the owner's time. Marginal cost per additional job is near zero
until coordination hours become the binding constraint — which is the real
ceiling, and the reason the back office described in §9 exists.

---

## 7. The referral program

A partner (shop, broker, FBO) refers an owner:

- The **owner** gets **15% off** AMG's coordination fee
- The **partner** receives **15% of the standard fee** as commission
- Both percentages are taken against the standard fee, *before* the discount, so
  the two are symmetric and easy to say out loud

Worked on the $495 piston fee:

| Party | Amount |
|---|---|
| Owner pays | $420.75 |
| Partner receives | $74.25 |
| **AMG retains** | **$346.50** (70% of standard) |

**The boundary.** The partner is paid a commission **by AMG, out of AMG's own
fee**. No money moves from the partner to AMG, and the partner never contracts
for the flight. That distinction is what keeps this a referral commission rather
than a shop buying movement of an aircraft it does not own.

**Disclosure is mandatory, not optional.** A maintenance shop advising its own
customer while collecting a commission on that advice is a conflict of interest,
and an undisclosed one invites a FDUTPA claim. Every referred quote carries:

> This quote reflects a 15% referred-client discount. The referring partner
> receives a referral commission from AMG equal to 15% of the standard
> coordination fee. The commission is paid by AMG out of its own fee and does
> not increase what you pay.

> **Open item.** Whether to actively market a fee to shops is still undecided.
> The mechanics and disclosure are built; the go-to-market posture is not
> settled. Some shops will read a commission as a conflict regardless of
> disclosure and would rather refer for free.

---

## 8. How a job actually runs

### 8.1 Intake
Requests arrive via `/request`, phone, or a partner referral. Intake captures
**requester relationship** — owner, manager, chief pilot, referring shop, broker
— at the very first touch, so the first callback already knows whether it has to
reach the owner instead of discovering that at proposal.

Every intake is stamped with an SLA deadline on arrival. The commitment is a
**24-hour quote response** — calendar hours, not business hours. (It was briefly
"24 business hours," which is three days. Bad promise for a business selling
speed; changed.)

### 8.2 Mission lifecycle

```
draft → submitted → under_review → {awaiting_client_info | quoted}
      → approved → crew_assigned → scheduled → in_progress → completed
```

Cancellation is legal from every non-terminal state. Transitions are validated
against an explicit table — an illegal jump is rejected by the system, not by
whoever is paying attention that day.

### 8.3 The two gates

**Movement gate** — fires on `crew_assigned`, `scheduled`, `in_progress`. Every
committed crew member must be **insurance-approved with current credentials**.
A missing crew profile counts as *not* approved. This is the single most
important control in the business: it makes it structurally impossible to commit
a pilot who does not meet the underwriter's written requirement, which is the
exact failure mode that would end the company.

**Closeout gate** — fires on `completed`. Documentation and billing prerequisites
must be satisfied before a mission can close.

### 8.4 Delivery
Crew are sourced from the vetted network, matched against the written
requirement, and confirmed. The owner selects the pilot. AMG documents the match
for the owner's broker. The pilot is paid by the owner; AMG invoices its
coordination fee only.

---

## 9. The back office

This is a one-person company running a coordination business where a dropped
detail is a safety and insurance event. The software is not a website with a
login — it is the operating system of the company, and it is the reason one
person can carry the load.

### 9.1 Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), TypeScript, React 19 |
| Hosting | Vercel |
| Database / auth / storage | Supabase (Postgres, RLS on all 88 tables) |
| Durable workflows | Vercel Workflow SDK |
| Transactional + outbound email | Resend |
| Payments | Stripe |
| Business email | Google Workspace |

72 versioned database migrations. Roughly 40 admin surfaces.

### 9.2 Access model

Five roles: `client`, `crew`, `partner`, `admin`, `super_admin`.

Three enforcement layers, all **allowlist, never denylist**:
- `requireUser` / `requireRole` — page-level guards. A user is admitted only if
  `status === "approved"`; anything else redirects to `/access-denied`.
- `requireApprovedPortalApiUser` — route-level guard for API endpoints
- Supabase RLS — row-level enforcement at the database

The allowlist posture matters. The earlier version was a denylist of blocked
statuses, which meant any *new* status value silently defaulted to admitted.
That is now inverted: unknown status = denied.

Every signup — password or Google OAuth — lands in **pending approval** and
cannot reach the portal until an admin approves it. That gate is unconditional
and applies identically to both auth paths.

### 9.3 Portal surfaces

**Client:** missions, quotes, invoices, documents, messages
**Crew:** assignments, credentials, availability, payouts
**Partner:** referred leads with an explicit assigned → quoted → accepted
lifecycle, transitions validated the same way missions are
**Admin:** missions, mission control, calendar, live crew map, CRM, quotes,
invoices, receipts, receivables, payouts, expenses, vendor invoices, financial
analytics, clients, crew, network applications, documents, compliance,
communications, audit log, security review, system health, users, user
approvals, settings

### 9.4 Audit and evidence

Every state-changing action writes an audit row with actor, action, entity, and
detail. Automated actions carry a **null actor id and their own address** rather
than borrowing a real admin's identity — a design decision made specifically so
the audit trail cannot lie about who did what. The audit log is queryable from
the admin portal.

### 9.5 Money

- Stripe handles invoices, receipts, and payment collection
- AMG invoices **only its coordination fee**
- **No trip funds pass through AMG.** Pilot rates, positioning, per diem,
  lodging, fuel, and vendor charges are owner-to-vendor. This is a legal
  requirement, not an accounting preference (§2).
- Receivables, payouts, expenses, and vendor invoices are tracked in-portal

---

## 10. Demand generation

Three channels, in descending order of how built-out they are.

### 10.1 Native prospecting agent (built)

Runs **inside the application** — no external API, no third-party data vendor,
no per-record cost.

Source: the **FAA Releasable Aircraft Registry**, a public dataset. The importer
streams the ~193 MB archive and filters line-by-line rather than loading it, so
it runs inside a serverless function.

Current scope: 93,927 aircraft-reference records parsed; **2,660 Florida turbine
aircraft** mapped to **2,054 distinct owners.**

Owners are scored on fit. The scoring is deliberately **non-monotonic on fleet
size** — bigger is not better:

| Fleet size | Score adjustment | Why |
|---|---|---|
| 1 | 0 | Single owner-flown aircraft, real gaps, no staff |
| 2–4 | **+12** | Best fit: multiple aircraft, no flight department |
| 5–9 | +4 | Probably has some staffing |
| 10–19 | −15 | Has a flight department |
| 20+ | −30 | Airline or cargo operator — not a customer |

The first version of this scoring ranked a 98-aircraft cargo operator as the #1
prospect. That is the failure mode a naive "more aircraft = better lead"
heuristic produces, and the curve above is the fix.

> **Why the FAA registry and not email scraping.** Scraping was tested
> empirically first: three target sites, **zero** usable email addresses
> recovered. The registry gives verified ownership and aircraft data — which is
> also the data that makes an outreach email specific enough to be worth reading.

### 10.2 Automated outreach sequence (built, gated off)

A durable three-touch sequence — introduction, then two follow-ups only if the
lead stays silent — running on the Vercel Workflow SDK so a run can span a week
and a half across deploys.

Defaults, all editable from **Admin → Settings → Outreach**:

| Setting | Default |
|---|---|
| Master switch | **Off** |
| Follow-up 1 delay | 4 days |
| Follow-up 2 delay | 7 days |
| Daily send cap | 25 |
| Send window | 09:00–19:00 ET |
| Send days | Mon–Sat |
| Timezone | America/New_York (DST-correct, not UTC-offset arithmetic) |

**Guardrails.** There is no per-email approval click, so every guardrail is a
code path — and all of them are **re-read from the database at each touch**
rather than captured at run start. "Switch it off" has to mean off *now*, not
off for runs that start tomorrow.

- Master kill switch
- **Templates must be explicitly approved** before anything sends
- Daily cap
- Send window and send days
- Suppression check before every individual send
- `do_not_contact` flag on the lead
- Stops permanently when the lead reaches a human-owned stage (`qualified`,
  `proposal`, `won`, `lost`)
- **Stops the moment a human enters the conversation** — an inbound reply, a
  logged call, a note. A reply is the entire point of sending; continuing past
  one would mean talking over a live conversation.

Every decision, including every decision to *stop*, is written to the lead's
activity history. The admin portal shows the full record.

**CAN-SPAM posture** (15 U.S.C. §7704(a)(3),(a)(5)). This is cold commercial
mail and the statute applies. Compliance is enforced in the **shared send
path**, not per-caller, so it cannot be omitted by a new caller or edited out of
a template:

- Working one-click unsubscribe in every message
- Real physical postal address in every footer
- RFC 8058 `List-Unsubscribe` / `List-Unsubscribe-Post` headers, which give
  Gmail and Outlook a native unsubscribe control and measurably reduce spam
  complaints on cold B2B mail
- Unsubscribes write to a suppression list checked before every send

**Voice.** Templates are written in the owner's own voice — plain, direct,
human-to-human, from someone who is a working pilot and writes like one. Two
failure modes are documented in the template file so neither recurs: AI-generic
copy that reads like a bot, and an overcorrection into folksy caricature. Both
were shipped and both were wrong. The current copy is modeled on a real email
the owner wrote.

### 10.3 Direct and social (manual)

Facebook group introduction posts written for four audiences — clients, crew,
MROs, brokers. Referral relationships with shops and brokers (§7). Direct
outreach.

### 10.4 Reply handling

Inbound replies are received by Resend webhook, matched against `crm_leads` by
from-address, logged as a `reply` activity on the lead, and automatically
advance the lead from `new`/`contacted` to `qualified`. This closes the loop:
the outreach sequence sees the reply and stands down, and the reply shows up in
the portal rather than only in a mailbox.

---

## 11. Email infrastructure

| Record | State |
|---|---|
| Google Workspace MX (business mail) | **Live** — priority 1 |
| Resend DKIM | **Live** |
| Resend SPF | **Live** |
| DMARC | **Live** at `p=none` |
| Resend inbound MX | **Pending** — must be on a subdomain |

**The subdomain constraint is not cosmetic.** Resend's inbound MX record at
priority 0 on the root domain would outrank Google Workspace at priority 1 and
silently take over the owner's actual business email. Inbound must go on
`reply.amgaviationgroup.com`, never the apex.

DMARC moves from `p=none` to `p=quarantine` once send volume confirms alignment.

---

## 12. Risk register

| Risk | Control |
|---|---|
| **Operational control drift** — a job structured so AMG looks like a carrier | Statement on every quote/invoice/receipt; owner-only contracting; zero markup; no trip funds; refusal list in §2 |
| **Uninsured pilot committed to a mission** | Movement gate — system-enforced, missing profile counts as not approved |
| **Undisclosed referral conflict → FDUTPA** | Mandatory disclosure text on every referred quote |
| **CAN-SPAM violation on cold outreach** | Enforced in shared send path: unsubscribe, postal address, RFC 8058, suppression list |
| **Runaway automation** | Kill switch, template-approval gate, daily cap, send window — all re-read at each touch |
| **Overstated credentials or affiliations** | Affiliations render only with a verified date; unverified entries are invisible by construction |
| **Portal privilege escalation** | Allowlist guards at page, route, and row level; unconditional approval gate on both auth paths |
| **Insurance rate bands unfillable** | Bands not republished until 12 pilots confirm in writing |
| **Key-person dependency** | Real and unmitigated. The business is one person. |

### Explicitly refused
A request to construct social proof — reviews, testimonials, or activity
signals — that did not reflect real customers was declined. Fabricated reviews
violate the FTC Rule on Consumer Reviews and Testimonials (16 CFR Part 465) and
FDUTPA, and misrepresentation in an insurance-adjacent context implicates Fla.
Stat. §627.409. The company launches with the proof it has.

---

## 13. Current state — what is real

### Live and working
- Public site: home, how-it-works, pricing, request, pilots, for-shops, legal
- Portal: five roles, ~40 admin surfaces, 72 migrations, RLS on all 88 tables
- Auth: email/password and Google OAuth, MFA enabled, admin approval gate
- Mission lifecycle with movement and closeout gates
- Quotes, invoices, receipts, receivables, payouts, expenses via Stripe
- Communications center with inbound reply logging
- CRM with lead pipeline and full activity history
- Native FAA prospecting agent — 2,054 Florida turbine owners scored
- Automated outreach workflow with all guardrails
- Security audit completed and documented (`docs/PORTAL_SECURITY_AUDIT.md`)
- Google Workspace mail, DKIM, SPF, DMARC live

### Built but gated off
- **Outreach automation** — master switch off, templates await approval
- **Inbound reply routing** — needs the Resend subdomain MX, `AMG_REPLY_TO`, and
  `RESEND_WEBHOOK_SECRET`

### Not in place, stated plainly
- **No published founder credentials, bio, or photo.** The team page was
  removed. The site currently speaks as a company with no named human behind it,
  which is a real conversion cost in a trust business and a deliberate,
  revisitable choice.
- **No verified affiliations.** AOPA membership is listed in code but does not
  render, because `verifiedOn` is null. Confirm it and it appears.
- **No completed missions, testimonials, or case studies.** There is no proof
  because there is no history yet.
- **Day-rate bands not confirmed** against twelve pilots in writing.
- **No subscription product.**
- **The $295 worked example predates the current fee schedule** and needs a
  repricing pass.

---

## 14. What launch actually requires

Owner-side, in order:

1. **Add the Resend inbound MX record on `reply.amgaviationgroup.com`** — never
   the apex, or business email breaks
2. Set `AMG_REPLY_TO` and `RESEND_WEBHOOK_SECRET`
3. **Read and approve the six outreach templates** — nothing sends until this is
   done
4. Flip the outreach master switch
5. Confirm AOPA membership is active and set `verifiedOn` so the badge renders
6. Confirm day-rate bands with twelve pilots in writing, then republish
7. Reprice the worked example against the current fee schedule
8. Decide the shop-referral-fee posture (§7 open item)
9. Decide whether to publish founder credentials (§13)

Then: first ten jobs, and everything above starts having evidence behind it.

---

## Appendix A — Numbers at a glance

| | |
|---|---|
| Coordination fee, piston | from $495 |
| Coordination fee, turbine | from $895 |
| Day scale, after days 1–2 | +$150 piston / +$250 turbine per day |
| Fee soft cap | 25–30% of pilot spend |
| Referral: client discount | 15% |
| Referral: partner commission | 15% of standard fee |
| Quote response commitment | 24 hours (calendar) |
| Request line hours | 0700–2200 ET |
| Outreach: touches | 3 (intro + 2 follow-ups) |
| Outreach: delays | 4 days, then 7 |
| Outreach: daily cap | 25 |
| Outreach: window | 09:00–19:00 ET, Mon–Sat |
| FAA records parsed | 93,927 |
| FL turbine aircraft | 2,660 |
| Distinct FL turbine owners | 2,054 |
| Database tables | 88, all RLS-protected |
| Migrations | 72 |
| Portal roles | 5 |

## Appendix B — Where the numbers live

| Fact | File |
|---|---|
| Fees, day rates, referral program, operational-control statement | `lib/site-config.ts` |
| Mission lifecycle, movement + closeout gates | `lib/portal/mission-lifecycle.ts` |
| Partner lead lifecycle | `lib/portal/partner-lifecycle.ts` |
| SLA deadline math | `lib/portal/sla.ts` |
| Access guards | `lib/portal/session.ts`, `lib/portal/api-guard.ts` |
| Outreach workflow | `workflows/lead-outreach.ts` |
| Outreach defaults + guardrails | `lib/portal/outreach-settings.ts`, `lib/portal/outreach-window.ts` |
| CAN-SPAM footer, suppression, send path | `lib/portal/lead-email.ts`, `lib/portal/lead-suppression.ts` |
| Template copy and voice notes | `lib/portal/lead-email-templates.ts` |
| FAA parsing and prospect scoring | `lib/portal/faa-registry.ts`, `lib/portal/faa-import.ts` |
| Security audit | `docs/PORTAL_SECURITY_AUDIT.md` |
| Worked example | `docs/amg-aviation-group-reference.md` |

## Appendix C — Open items

1. Day-rate bands unconfirmed — 12 pilots, in writing, before republishing
2. Worked example priced at a legacy $295 fee — needs repricing
3. Class-tiered coordination fee may double-count a variable the pass-throughs
   already scale on; the defensible version is that turbine jobs carry a
   mandatory underwriter-endorsement step piston jobs often skip. Decide before
   it goes live.
4. Shop referral fee — build is done, go-to-market posture undecided
5. Founder credentials — currently unpublished
6. DMARC `p=none` → `p=quarantine` once volume confirms alignment
7. Subscriptions — not sold until on-demand demand is proven

---

*Prepared July 2026. Every figure traces to a file in Appendix B. When a number
changes in the code, it changes here.*
