# AMG Launch Kit

Everything needed to sell and deliver AMG's first engagements. These are operating
documents, not background reading — they are meant to be printed, sent, filled in,
and argued with.

## Read `00-REVIEW.md` first — the kit is not ready to use

An adversarial review of everything here found **27 issues, five of them
STOP-severity**. Where the review disagrees with a document, **the review wins
until the document is corrected.**

The five STOP items, none of which are style notes:

1. **Four documents publish four different take rates for the same job**, and the
   pricing model does not close arithmetically.
2. **AMG "clears" flights to launch** — language that claims an authority AMG does
   not have and must never imply.
3. **The fee is collected before the insurance gate that can kill the job**, and no
   document says what happens to the money when the gate fails.
4. **The prepaid credit block is sold against terms that contradict the agreement**,
   and no block agreement exists.
5. **The kit sells jets on day one from a bench of zero**, against its own rule.

Fix those before any of this reaches a customer. Everything below describes what
the documents are *for*, not that they are finished.

## The documents

| # | Document | What it is for |
|---|---|---|
| 01 | [Coordination Services Agreement](01-coordination-services-agreement.md) | The contract between AMG and the aircraft **owner**, plus a cover note to counsel. **Draft for review — not legal advice.** |
| 02 | [Insurance Gate and Trip File](02-insurance-gate-and-trip-file.md) | The checklist that runs before any pilot launches, the broker email templates, and what is retained per job. **The most operationally important document here.** |
| 03 | [Capability One-Pager and Proposal](03-capability-one-pager-and-proposal.md) | The PDF attached to every first reply and left on every shop counter, and the proposal sent after a qualifying call. |
| 04 | [Call Scripts and Objections](04-call-scripts-and-objections.md) | Shop call, insurance broker call, inbound owner call, voicemails, and twelve objections answered. |
| 05 | [Email Sequences](05-email-sequences.md) | Four audiences, four touches each, plus deliverability and CAN-SPAM rules. |
| 06 | [Pilot Bench Recruiting](06-pilot-bench-recruiting.md) | Supply side. Selling a ferry with no pilot to fly it is worse than not selling it. |
| 07 | [Mission SOP and Tracker](07-mission-sop-and-tracker.md) | The runbook from inbound request to closeout, the daily rhythm, and the tracker spec. |
| 08 | [First 90 Days](08-first-90-days.md) | Sequencing: what blocks selling, what does not, and the honest arithmetic on the 14-day target. |

**Not written yet: 09, the prospect list.** The agent building it did not finish.
Build it by hand from §VI of `../LAUNCH_INTELLIGENCE_BRIEF.md`, which has the
sources, the costs, and the two Florida insurance brokers already verified.

Supporting research lives one level up: `../LAUNCH_INTELLIGENCE_BRIEF.md` (verified
market and regulatory findings) and `../LAUNCH_PLAN_14_DAY.md` (earlier plan, partly
superseded by the brief).

## Trackers

`trackers/*.csv` import straight into Google Sheets. Row 1 is headers; row 2 is a
legend of allowed values — delete it once the columns are familiar. Columns match
the spec in document 07 exactly.

- `pipeline.csv` — one row per contact
- `pilot-bench.csv` — one row per pilot
- `jobs-delivered.csv` — one row per completed job
- `mail-merge.csv` — the send list for document 05

## The rules everything here is built on

1. **AMG never furnishes the aircraft.** Supplying labour is not supplying
   transportation. This one sentence is what keeps AMG outside Part 119/135.
2. **The owner contracts with AMG.** Always — even when a shop or broker brought
   the lead. The shop is a referral source, never the customer.
3. **The owner pays the pilot directly.** AMG's invoice has one line. AMG never
   handles trip funds, never marks anything up, never takes a vendor rebate.
4. **No written broker approval, no flight.** The insurance gate is not friction
   slowing the sale down. It is the thing being sold.
5. **On a trip where Tony is PIC, there is no coordination fee** — pilot services
   only, under a separate agreement engaging him personally.

## Before any of this is used

Blocking, and only Tony can clear them:

- **Aviation insurance bound.** Describe all four services verbatim on the
  application — Fla. Stat. §627.409 lets an insurer rescind for a material
  misrepresentation, including an innocent one.
- **Document 01 reviewed by a Florida aviation attorney.** Sell while they work;
  do not sign anything first.
- **Founder credentials and photo** into `lib/site-config.ts` (`TEAM_ROSTER`).
- **Real street address** into `SITE.streetAddress` — CAN-SPAM requires a physical
  postal address in every commercial email, so cold outreach is blocked until this
  is published.
- **FDACS**: confirm which §501.604 exemption applies before the first sales call.
- **Verify the AOPA membership** in `AFFILIATIONS` is current, or remove it.

Every published day rate in these documents is a benchmark, not a commitment.
Do not publish a rate band until twelve pilots have confirmed their number in
writing.

## Two open pricing decisions

Both are live on the site right now at one value and recommended in these
documents at another. Neither is mine to settle — pick one and make the site and
the kit agree.

1. **The piston coordination fee.** The site publishes **$495**. Document 08
   argues that is roughly one full piston pilot day ($400–600) charged to the
   most price-sensitive segment in aviation, and recommends **$295–$395, or
   taking piston off the published price list entirely** and quoting it case by
   case. The counter-argument for holding $495: the coordination work — sourcing,
   the insurance gate, scheduling — is nearly identical regardless of aircraft
   class, so pricing off the pilot's day rate undervalues it.
2. **Whether the fee should be class-tiered at all.** Turbine jobs carry a
   mandatory underwriter-endorsement step that piston jobs often skip, which is
   the defensible reason for a tier. Absent that, class-tiering the fee while the
   pass-throughs already scale by class may be charging twice for the same
   variable.

Day-scaling (+$150/day piston, +$250/day turbine beyond day 2) is already live on
`/pricing` and is not in dispute — document 08 calls it the single change that
most improves revenue per hour of Tony's time.
