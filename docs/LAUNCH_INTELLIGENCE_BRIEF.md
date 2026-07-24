# AMG Aviation Group — Integrated Launch Intelligence Brief
**Compiled 2026-07-24 · Chief Revenue Officer · supersedes all individual research areas**

Sources: 6 research areas, 4 of which carried adversarial fact-checks. Where a checker contradicted a researcher, the correction is applied and the original is named as dropped. Repo claims below were verified directly against `/home/user/amg1` on 2026-07-24, not taken from the research. Two areas (`demand-channels`, `outbound`) shipped **unchecked** — every number sourced only to them is flagged.

---

## I. The five things that change what you do Monday morning

### 1. `/for-shops` is live, and it is the single most dangerous page AMG has published

Verified in `/home/user/amg1/app/(public)/for-shops/page.tsx`:

- Line 8 — page `<title>`: **"For Shops & Flight Departments — Fleet Agreements"**
- Line 10 — meta description: *"MROs, brokers, and 1–2 aircraft flight departments: volume coordination pricing, a dedicated coordinator, tailored SLAs, and monthly invoicing under one Fleet Agreement."*
- Line 24 — *"Tailored SLAs … with the same automatic fee-credit remedy our owner plans carry."*
- Line 28 — *"One consolidated invoice, every pass-through receipt attached, zero markup."*
- Line 194 — *"Fleet Agreements are the one thing we quote-price."*

That page simultaneously does five things on AMG's own do-not-do list: sells a standing arrangement to **someone who is not the aircraft owner** (and names *brokers* as a target customer); implies **guaranteed availability** via SLAs with automatic remedies; **quote-prices** an arrangement; puts the possession word **"Fleet"** in a `<title>` and meta description for a company with no aircraft; and cites **"our owner plans"** — a subscription product on the explicit not-selling-yet list.

The regulatory researcher scheduled the third-party-payment fix as a week-1 drafting task. Its fact-checker is right and wins: **it is already shipped.** A disclaimer footer under a page titled "Fleet Agreements" that promises SLAs and monthly invoicing to brokers is worse than no footer — it reads as boilerplate the site's own copy contradicts.

**Monday, before anything else:** take the page down or reduce it to one paragraph — *"Shops refer their customers to AMG. The aircraft owner contracts with AMG and pays AMG directly. We never take payment from a shop to move an aircraft the shop does not own."* Retitle away from "Fleet." Delete SLAs, fee-credit remedies, monthly invoicing, dedicated coordinator, and the word "brokers." **20 minutes.**

Related, same file family: `lib/site-config.ts` lines 96–123 contain a full `PLAN_TABLE` with subscription tiers ($149/$299/$349/$649 per month), SLA windows, automatic fee-credit remedies, and a "request line staffed 0700–2200." `WORKED_EXAMPLE` (line 82) prices a mission as a *"Standard plan member"* at $295. **Good news I verified myself:** `components/site/fare-board.tsx` and `components/site/worked-example.tsx` import these but are **not imported by any page** — the subscription pricing is dead code, not live. Leave it dead. But `/legal` line 33 still says AMG's fees are *"flat, published coordination fees **and plan fees**"* — delete "and plan fees," and delete the `/for-shops` reference to owner plans, or the dead code becomes a published promise by reference.

### 2. `/pilots` promises AMG will pay the pilot out of AMG's own pocket. No researcher caught this.

`/home/user/amg1/app/(public)/pilots/page.tsx` lines 100–108, live:

> **"Fly vetted missions. Get paid in 7 days."** … *"Join AMG's contract pilot network: we source the clients, paper the agreements, and pay you within 7 days of mission completion — **whether or not the owner has paid us yet.**"*

Reinforced on `/team` (`FOUNDER_FACTS`: "Pilot payment — Within 7 days").

This is the exact opposite of the decisive answer every research area converged on. It makes AMG the pilot's **paymaster** (control and employment optics under 14 CFR 1.1 and common-law agency), the **1099-NEC issuer**, the party exposed on Florida worker-classification and workers' comp (Fla. Stat. ch. 440), and — operationally — a **lender** funding five figures of pilot pay against an $895 fee, from a company with $0 collected. One 14-day turbine coverage at $1,650/day is $23,100 AMG has promised to advance.

**Monday:** replace with *"The owner contracts with you and pays you directly. AMG confirms your rate, terms, and the owner's insurance approval in writing before you launch."* If the 7-day hook is load-bearing for recruiting, the only honest version is *"AMG chases the owner's payment for you and will tell you before you accept if the owner has not funded."* **15 minutes.** Do not keep the current sentence.

### 3. Decisive: the **owner** pays the pilot. AMG's invoice has one line.

Unanimous across regulatory, offer-pricing, and both of their fact-checkers. Neither structure is per se illegal — crew-only sourcing does not become an air carrier operation because of an invoice path — but every element that makes a coordinator look like an operator attaches to the pay-through model, and one element (an AMG invoice showing per-leg or per-hour pilot cost) is precisely what a **claims adjuster** reads when deciding whether the owner's Part 91 "purpose of use" clause was breached. The FAA may never appear; the adjuster will.

Kill from `/pricing` (line 26–28) and `/legal` (line 33) the words *"passed through at cost with receipts."* Replace with: **"Pilot day rate, positioning, per diem and lodging are paid by the owner directly to the pilot or vendor. AMG never marks up and never handles trip funds."**

The offer-pricing fact-checker caught the consequence nobody else did: **once you make this change, three drafted contract clauses become incoherent** — you cannot "prepay estimated pass-throughs and true up with receipts," you cannot charge "one full pilot day" on cancellation, and the ACH-vs-card fee analysis (which priced a $23,000 AMG-processed transaction) evaporates. On an $895 receivable the card/ACH delta is about $21, not $665. Delete those clauses; put pilot cancellation terms **between owner and pilot** and make only AMG's own fee non-refundable once a pilot accepts.

One carve-out: if an owner insists AMG front an airline positioning ticket, reimburse it as a documented AMG out-of-pocket expense at cost — never as an hourly or per-leg amount, never as pilot compensation.

### 4. Build the insurance gate before the next sales call. It is the largest real exposure and the best sales asset.

The regulatory contrarian is right that over-lawyering week one is the expensive mistake — crew-only sourcing for an owner who already owns the aircraft is a decades-old, low-enforcement-risk business, and the FAA's illegal-charter bandwidth is aimed at people selling seats and sham dry leases. The exposure that actually ends AMG is **an insurer denying a hull claim because nobody confirmed the pilot was an approved pilot.**

Hard gate, no exceptions, before any pilot launches:

1. **Commercial or ATP certificate.** Never a private pilot. Missed by every research area until a fact-checker caught it: 14 CFR 61.113(a) bars a private pilot from acting as PIC for compensation or hire. This breaks most often in service line 3 — a high-time *private* pilot friend of the owner acting as a paid "mentor."
2. Medical, ratings, type rating where applicable, last recurrent completion certificate.
3. TT / ME / turbine / make-and-model / 90-day times.
4. For SIC work on domestic Part 91: **61.55(b) currency within the preceding 12 calendar months**, not an SIC type rating (see §II).
5. W-9 and the pilot's own non-owned aircraft liability COI.
6. **A written email from the owner's broker or underwriter naming that specific pilot** as within the open pilot warranty or added by endorsement. No email, no flight.
7. **On any ferry under a special flight permit:** the broker's written acknowledgment of the ferry *in the same email*. Many hull policies require prior notice to the underwriter for flight under a permit, not merely that a permit exists.

For turbines, assume there is **no usable open pilot warranty** and that the pilot must be added by written endorsement. Industry practice on turbine equipment is named-pilot or "approved by the company in writing," often conditioned on annual recurrent at FlightSafety or CAE. Endorsement turnaround is typically 24–72 hours *(UNVERIFIED — sourced to industry-practice summary, not to a 2026 carrier form; confirm with the first broker you call).* Consequence: **"we can have someone there tomorrow morning" is a promise AMG frequently cannot keep on a jet.** Sell the approval step as the product, not as a delay.

**Do not advertise "we verify the pilot."** Say: *"We confirm certificates, currency and time-in-type, and we put the pilot's qualifications in front of your broker for written approval before the flight."* The owner's broker issues the approval. Advertising verification as your product creates a duty of care you are not currently insured against.

Note: the ticker at `components/flightdeck/ticker.tsx` line 13 already publishes **"Crew · credential-reviewed."** That is a representation about a third party's quality — the exact thing DOT sanctioned in the BlueStar consent order (Order 2005-11-6, misrepresenting "the quality of service and safety record of companies with which it arranged air transportation services"). It needs the written checklist behind it, with copies retained per job, starting on job one.

### 5. The 14-day number is only reachable if you fly them — and that requires a different structure and paperwork

Honest arithmetic. Fee-only: $895 × 6 jobs = $5,370; the $10k end needs 11 coordinated turbine jobs in 14 days from a standing start. Not happening.

Gross collected, with Tony as PIC: 5 ferries × 2 days × ~$1,400/day ≈ $14,000 of pilot revenue plus whatever coordination revenue exists. That clears the target. But the regulatory fact-checker flagged the thing no researcher addressed:

**On any trip where AMG collects a coordination fee AND Tony is the PIC, the sitewide statement "aircraft owners retain operational control" is still true, but "AMG supplies labor, not transportation" collapses — AMG and the pilot are the same party, and the fee starts to look like a price for a flight.**

Resolution, and this is a rule not a preference: **on self-flown trips, charge pilot services only. No coordination fee. Separate one-page agreement in which Antonio Gonzalez is engaged personally by the owner as an independent contract pilot, invoiced by the day.** Clean paper, clean optic, and the money is identical. It also means your prospect list should be filtered by **what Tony is current and insurable in**, not by what exists within 100nm.

Second consequence: month 6's $15–30k/month cannot come from more $895 events. $30k/month at $895 is 33 coordinated events — roughly 1.5 per business day, each sourced, insurance-verified and shepherded by one person who is also flying a line. Arithmetically impossible. The paths that exist are (a) a day-scaled coordination fee, (b) prepaid credit blocks that turn one sale into many events, (c) Tony's own flying as the revenue base with coordination as the margin layer. Pick now; the current price sheet quietly commits to a ceiling near $10–12k/month.

---

## II. Regulatory guardrails

### The one sentence that does the work

**AMG never furnishes the aircraft.** Illegal charter requires an entity providing transportation — aircraft plus crew — for compensation. Supplying labor alone is not transportation. AC 120-12A (Apr. 24, 1986, still active) sets the four-element common carriage test: (1) a holding out of a willingness to (2) transport persons or property (3) from place to place (4) for compensation. 14 CFR 1.1 defines operational control as *"the exercise of authority over initiating, conducting or terminating a flight."* AMG is not paid for use of an aircraft and is not in operational control.

**Do NOT lead with 14 CFR 119.1(e)(3) "ferry or training flights."** The regulatory researcher called this "AMG's strongest legal ground," marked it verified, and told the founder to lead with it in sales calls. Its fact-checker refuted this and wins. 119.1(e) is an exception from **certification**, not an affirmative authorization to carry persons or property for compensation. FAA Chief Counsel guidance (Grannis, 2017, *Clarification of the Exceptions in 14 CFR § 119.1(e)*) frames it as: persons conducting (e) operations do not need a Part 119 certificate and may operate under Part 91. Reciting "(e)(3) covers ferries" in a sales call invites the follow-up that breaks it — *"great, so the owner can ride along and pay you?"* The moment a passenger or revenue cargo is aboard, (e)(3) does not save the flight. Also, the researcher's quoted text is stale; current 119.1(e) opens *"Except for operations when common carriage is not involved conducted with any airplane or **powered-lift** having a passenger-seat configuration of 20 seats or more…"* Cite (e)(3) as a secondary belt-and-suspenders point only.

### The do-not-do list — recite before the first sales call

1. Quoting a price **per flight, per leg, or per hour** instead of a fee for a service.
2. Selecting or supplying the **aircraft**, or supplying aircraft and crew as a package.
3. Taking payment from a **passenger, a shop, or anyone who is not the aircraft owner**.
4. Making or influencing the **go/no-go, fuel, route or release** decision.
5. Advertising **availability of lift** ("we can get you to Teterboro Thursday").
6. Maintaining a **list of available aircraft**.
7. Paying trip operating expenses and **rebilling** them.
8. Using the word **"dispatch"** for what AMG does (14 CFR 65 Subpart C is a regulated role implying operational control).
9. A **dry lease plus mandatory AMG-supplied crew** — the FAA's classic sham-dry-lease fact pattern.
10. **Quoting one all-in delivered price** for moving an airplane. Two researchers recommended this (offer-pricing action item, competitors contrarian). **Both fact-checkers refuted it and the correction wins.** Contracting to produce a flight result, combined with AMG selecting the pilot and setting the schedule, is the standard indicia set for exercising operational control. The immediate exposure is not the FAA — it is the owner's "purpose of use" clause and an adjuster reading your invoice. If you ever want to test it, that is a call with an aviation attorney and your broker, not a 30-minute website edit.

Items 2, 3 and 9 are the ones a maintenance-shop lead walks you into by accident.

Hard rule: if a caller asks *"can you get me a plane"* — **"AMG doesn't provide aircraft. I can refer you to a Part 135 operator and I take no fee for that referral."** Taking a fee makes you an air charter broker under DOT's 14 CFR Part 295, with disclosure duties, on top of the FAA problem.

### Vocabulary — verified against the actual repo, and the research was wrong about it

The regulatory researcher predicted "dispatch" was the word most likely already in the copy and budgeted 45 minutes to purge it. Its fact-checker ran the grep and found it appears only as an internal image key and admin-portal label — zero public-facing prose. I re-ran it: **no "charter," no "24/7," no "our pilots," no "book now" in `app/(public)`.** The purge is already done.

The credibility researcher claimed *"US based · worldwide coordination"* is live on the ticker. **Stale — I verified it is not.** `components/flightdeck/ticker.tsx` carries an explicit comment: *"'Worldwide coordination' was removed: the service area is the Southeast US and we should not imply otherwise."* Drop that action item.

What **is** live and needs work (`ticker.tsx` lines 10–19, `/team` lines 14–20):

| Live claim | Status | Fix |
|---|---|---|
| "Ops desk 0700–2200 ET" | Unmeetable from FL410 | "Calls returned same business day, 0700–2200 ET" and forward the phone |
| "Quote · 24 hr" / "Quote response — 24 business hrs" | Keepable — but **contradicted by `/how-it-works`**, which says the process *"does not promise availability, acceptance, or a response time"* | Pick one. A promise plus a disclaimer that denies it is worse than either alone |
| "Crew · credential-reviewed" | True only once §I.4 checklist exists | Add one line naming what is checked |
| "$0 pass-through markup" | Must be literally true | Add "and we accept no rebates from vendors." Any FBO or fuel rebate makes it false under the FTC Act and FDUTPA |
| "Pilot payment — Within 7 days" | See §I.2 | Delete |
| `AFFILIATIONS = ["AOPA Member"]` in footer and `/team` | Unconfirmed | Verify the membership is current or remove it |
| `SITE.streetAddress` = "North Lauderdale, FL" with a `TODO: publish full street address` | Blocks CAN-SPAM compliance | Publish the real street address before any cold email |
| `TEAM_ROSTER` — `credentials: null`, `photo: null` | Highest-value free asset unbuilt | See §VII |

**Safe vocabulary:** coordination, sourcing, referral, scheduling and logistics support, independent contract pilots, the owner's aircraft, flat coordination fee, "the owner and PIC retain operational control," "we are not an air carrier and do not provide aircraft."

### Footer and quote/invoice disclaimer

Partly done. `lib/site-config.ts` line 24 already carries `OPERATIONAL_CONTROL_STATEMENT`, rendered in `components/site/site-footer.tsx`. Strengthen it and put it on **every quote and every invoice**, not just the site:

> AMG Aviation Group is not an air carrier, commercial operator, air charter broker, or Part 135 certificate holder. AMG does not own, provide, lease, dispatch, or operate aircraft and never holds operational control as defined in 14 CFR 1.1. The aircraft owner and the pilot in command retain all operational authority.

### Maintenance ferry and special flight permits — corrected

When the aircraft is out of annual, has an expired inspection, or an unairworthy discrepancy, the ferry requires a **special flight permit under 14 CFR 21.197**. AMG must never be the applicant or the signer.

Three corrections to the research, all from its fact-checker, all applied:

- **21.197 contains no compensation language.** The researcher wrote (marked "verified") that "passengers or property for compensation may not be carried under the permit" and attributed it to 21.197. The regulation does not say that. The restrictions on any given permit come from the **operating limitations issued with that specific permit** under 21.199, binding via **91.9(a)**. Say *"the permit carries its own operating limitations — read them, and the trip file gets a copy."* A DAR or the owner's IA will contradict you otherwise, in front of a customer.
- **8130-6 is the application; 8130-7 is the permit.** The researcher said the FSDO or DAR issues Form 8130-6. Wrong direction. The owner or the owner's A&P/IA submits **8130-6** (Application for Airworthiness Certificate) under 21.199; the FSDO or DAR issues **8130-7** (Special Airworthiness Certificate) with attached operating limitations. The trip file needs a copy of the **8130-7 and its limitations** before launch. *(UNVERIFIED on the form-number pairing — the checker flagged moderate confidence. Confirm with the issuing FSDO or DAR on the first job. But never ask for "the 8130-6" as proof of a permit.)*
- **21.197(c) continuing authorizations** are available only to 91.1017 fractional programs and 119.51 certificate holders. Not to a Part 91 owner. **Every AMG ferry needs an individual permit.**

Also warn the owner: many hull policies restrict coverage for flight with a known airworthiness deficiency unless the ferry permit is in place, and several require prior *notice* to the underwriter. Verify. Do not assume.

### Mentor / second-pilot work — the research was wrong here

**Dropped:** the action item telling the founder to ask the underwriter whether the role needs "a required second-in-command (SIC type per 61.55)." **14 CFR 61.55(a)(3) requires a type rating for SIC service *unless* "the flight will be conducted as domestic flight operations within the United States airspace."** AMG coordinates domestic Part 91 flights out of South Florida. SIC type rating is the ICAO-driven international requirement. Acting on the research as written would make Tony reject qualified contract pilots and promise owners a credential the reg does not require — in front of aviation-literate buyers.

**Correct:** for domestic Part 91 SIC service the pilot needs **61.55(b) currency** — familiarization and the specified pilot time (takeoffs/landings, engine-out procedures, CRM) within the preceding 12 calendar months — plus at least a private certificate with appropriate category/class and an instrument rating if IFR. And, per §I.4, **Commercial or ATP** if he is being paid.

Still ask the underwriter, in writing, **which role the policy requires**: a second pilot, or an **instructor** (needs a CFI certificate under 61.193). Record the answer in the trip file. The common illegal setup is a non-CFI "mentor" giving instruction the owner logs — which voids the very insurance requirement the owner was trying to satisfy.

**Unaddressed by all research, flag it now:** the **single-pilot-certificated jet problem.** In a CJ-series, Phenom 100/300, TBM or PC-12 certificated for single-pilot ops, an insurer-required second pilot is **not a required crewmember**. That pilot generally cannot log SIC time — a real recruiting friction, contract pilots care about this — and compensation of non-required crew on a Part 91 flight is a **murkier area than any research area acknowledged. UNVERIFIED. Get this specific question in front of the aviation attorney in §IX.**

### 91.23 truth-in-leasing — not live, but fix the mental model

AMG does not lease aircraft, so 91.23 is not triggered. But the researcher wrote that it becomes live "the day the founder touches a Hawker or Challenger." Its fact-checker corrected this and wins: **"large civil aircraft" is more than 12,500 lbs MCTOW (14 CFR 1.1), and most of AMG's published turboprop-and-light-jet band is already over it** — King Air 350 ~15,000; Citation CJ3/CJ3+ ~13,870; Citation XLS/Excel ~20,200; Phenom 300 ~17,968; Learjet 45 ~21,500. Only the small end is under (Citation M2 ~10,700, CJ1; King Air 200 sits at exactly 12,500 and is therefore *not* large). "Large aircraft" status attaches on a routine light-jet job, and it also keys 91.501/91.509 applicability, two-pilot crewing expectations, and a large number of insurance and lease provisions. Do not get talked into "papering a quick lease."

### Florida-specific — genuinely unresearched

**UNVERIFIED, all of it.** No research area covered Florida sales-tax treatment of a coordination service fee, local business tax receipt, or workers' comp / independent-contractor exposure under Fla. Stat. ch. 440. Twenty minutes with a Florida CPA before invoice one, not after. One point in the two-invoice structure's favor that should be named explicitly: **if the owner pays the pilot directly, AMG issues no 1099-NEC and takes on no payer obligations.** The moment AMG collects and remits pilot pay, it acquires all of them.

---

## III. Real market pricing — does $495 / $895 hold?

### The $895 turbine fee holds. The $495 piston fee does not.

On a one-day light-jet ferry, $895 on a ~$1,650 pilot day is a **35% take rate** — dead center of the locum tenens 30–50% band, and the same shape as every temp-staffing markup (30–75% over pay rate). It is not cheap. It is correctly priced.

$495 on a piston job is a different story. Confirmed piston ferry rate: **$400–500/day for an experienced, insurable single-engine pilot**; less-experienced $200–300. A $495 coordination fee is roughly **100% of one pilot day and 25–40% of the entire job**, charged to the most price-sensitive owner segment in aviation — the same owner who can post in a type-club Facebook group and get three volunteers by dinner. Same work as a jet job, worst buyer, least likely to repeat.

**Dropped:** the twin figure. The competitors researcher published "piston twins $350–450/day," below its own single-engine figure. Its fact-checker showed the two schedules were stitched together — $350–450 is AIC JETS' "medium propeller aircraft" category, not a twin rate. **There is no reliable published piston-twin figure.** Set it by asking two twin-qualified pilots in your network what they charge.

**Decision on piston:** drop it from the published price page as a flat fee. Do **not** replace it with an all-in delivered number (see §II do-not-do item 10 — both fact-checkers refuted that). Either quote piston case by case with the fee stated separately, or state a piston fee that is defensible by the work it covers (insurance approval, shop slot, ferry permit) rather than by the aircraft class.

### The published day-rate bands are wrong in both directions

Current, `lib/site-config.ts` line 30–33: Piston **$500–800/day**; Turboprop & light jet **$1,000–1,600/day**, "updated July 2026."

The competitors researcher and the demand-channels researcher both said: raise the turbine band to $1,500–1,850. The offer-pricing researcher said: *lower* the turboprop band to $1,000–1,300. **Both are wrong, and the offer-pricing recommendation was the more damaging one** — its own fact-checker showed $1,300 is up to $800/day under market for a King Air 360 captain, i.e. the "correction" would have made the price sheet worse than what is already shipped.

The resolution comes from the competitors fact-checker and is the most useful pricing insight in the whole research set: **AMG is publishing trip-crew rates against ferry work.** Those are two different markets.

| Mission | Piston | Turboprop | Light jet |
|---|---|---|---|
| **Ferry / repositioning**, single pilot, empty | $400–600 | $700–1,200 | $700–1,200 |
| **Trip and callout coverage**, revenue mission | $400–600 | $1,200–2,100 | $1,500–2,500 |

Ferry-side evidence: AIC JETS' published card runs $200–300/day piston singles, $350–450 medium prop, $500–650 light jets and turboprops, $700–1,500 large jets; Skyfarer reports $600–800/day to ferry a King Air or small jet and $800–1,000 for cabin-class twins; CrewBlast's public floor is **$700/day for a BE-200 King Air — below AMG's existing turboprop band, not above it.**

Trip-side evidence, by type: King Air 250 $1,200–1,600; King Air 350 $1,500–2,000; King Air 360 $1,600–2,100; PC-12 $1,200–1,500; TBM 960 $1,500–2,000; Citation M2 $1,200–1,500; CJ3+ $1,500–2,000; Citation XLS $1,500–2,000; CJ4 Gen2 $1,800–2,200; Learjet 75 $1,800–2,000; Latitude $1,800–2,400; Challenger 350 $1,800–2,500.

**Two source caveats, both from fact-checkers, both binding:**
- The Professional Pilot Network rate table — the origin of most of the by-type numbers above — displays *"This Website Is Currently UNDER CONSTRUCTION"* and is a self-published community database with **no stated methodology or sample size.** Every figure was reproduced accurately, but **it is one unaudited page, not a survey. Marked UNVERIFIED as a market benchmark**, notwithstanding that two research areas labeled it "verified."
- **Phenom 300 is contested:** CrewBlast puts it in the $1,500–1,850 light-jet band; PPN lists $1,800–2,500 PIC. PC-24 similarly at $1,600–2,200. These are the most common light jets in South Florida. **Quote them individually, never off a band.**

**Recommendation:** stop publishing bands, or publish the mission-split table above with "Phenom 300, CJ3+, CJ4, Challenger quoted individually." And — from the lead-sources fact-checker — **do not publish any band until twelve pilots have confirmed their number to you in writing.** Publishing a rate you cannot fill is the exact failure the research warns about at the low end and then recreates at the high end.

### Day-scale the coordination fee

The flat fee is structurally broken above two days. $895 on a one-day ferry is a 35% take; $895 on a 14-day vacation coverage at $1,650/day is **3.7%** — for more work. Locum tenens never has this problem because it bills per day; yacht delivery never has it because every line is per-day.

**$495 / $895 covers days 1–2, then +$150/day piston, +$250/day turboprop and light jet, soft-capped at 25–30% of total pilot spend.** A 3–4 day turbine ferry moves from $895 to $1,145–1,395. A 14-day coverage moves from $895 to ~$3,895. The 14-day goal drops from 6–11 jobs to 4–7.

Open question nobody tested, worth ten minutes before you rewrite the page: **the coordination work is nearly identical for a King Air ferry and a CJ4 ferry** — same sourcing, same insurance verification, same scheduling. Class-tiering the *fee* while the *pass-throughs* already scale by class may be double-counting the same variable. The defensible version of a class-tiered fee is that turbine jobs carry a mandatory underwriter-endorsement step that piston jobs often don't.

### The wedge is narrower than the research claimed

**Dropped:** *"Every contract-pilot staffing firm hides its price. None publish a fee. This is AMG's single most defensible wedge."* Refuted by the researcher's own source — AIC JETS publishes typical daily rates by aircraft category; The Ferry Pilots Ltd. advertises transparent pricing; CrewBlast publishes a public contract-pilot daily-rate dataset. A prospect who has seen AIC JETS' card will catch this on call one.

**What is actually unpublished is the intermediary's own fee or markup.** Nobody discloses what they take. State it narrowly: *"We publish our fee. The pilot's rate is between you and the pilot, at cost, with no markup and no rebate to us."*

Related: **zero-markup pass-throughs are the category norm, not a differentiator.** Several ferry operators already advertise "only the actual costs of variables." The differentiation is the coordination work — insurance approval, shop slot scheduling, documentation — and the fact that you publish your fee.

### The competitor picture, corrected

Every W-2 **employer-of-record** competitor (In-Flight Crew Connections, Aircare International, Corporate Aviators, Flight Crews Unlimited) sells the two things AMG structurally refuses: a single throat to choke and someone else's insurance. Aircare explicitly markets *"IRS employee tax misclassification protection."* **The "who employs the pilot?" objection will arrive on call one.** Rehearsed answer: the pilot contracts directly with the owner, the owner retains operational control, here is the W-9 handling — and that answer is only true once §I.2 and §I.3 are done.

**Dropped:** PerDiem Pilots / Aircraft Ferry LLC as a competitor. Its site shows Boeing 717 through 787, MD-80s, Airbus A310–A340, lease returns, bonded export/import, US government contractor CAGE 5L0R9, and RVSM ferry **on its own FAA OpSpecs** — operating authority AMG explicitly does not hold. Zero overlap with a post-maintenance Bonanza out of KFXE.

**Dropped:** Flight Crew International (fci.aero) as a cited reference. The entire domain returned **HTTP 521** on 2026-07-24. The quote-turnaround and phone-number claims came from an archived copy. A competitor whose site is down is worth one phone call, not a citation.

**Real price competition in South Florida piston and light-turbine repositioning** is individual pilots on Barnstormers "Ferry Service" classifieds, Trade-A-Plane services listings, Pilots of America, and type-club groups — cheaper and more fragmented than the agency list, which argues *harder* for selling to shops and brokers rather than owners.

**Dropped:** submitting a fabricated crew request through CrewBlast to extract competitor pricing. South Florida business aviation is a small, high-gossip market and Tony's core asset is his standing in it. The "first crew request is free, no registration" wording could not be verified. Get the same intelligence by asking two flight-department managers what they were last quoted, and by reading CrewBlast's public rate page.

---

## IV. The single highest-probability first sale

**An independent maintenance shop's customer whose aircraft needs to move — with the OWNER as AMG's contracting party.**

Why this and not an owner directly: an owner who already has a trusted contract pilot's number has zero reason to add $895 and a middleman, and a type-club post costs $0. **You lose that fight every time.** The buyer with a genuine gap is the shop's service writer, the broker's closer, and the insurance-driven transition — parties with an aircraft that must move, no crew relationship, no desire to be the one who picked the pilot, and a customer waiting.

The pitch is not "cheaper" and not "better pilots." It is **throughput**: *"An airplane you can't get onto your ramp is a slot you can't bill. I get your customer's airplane here this week instead of next month, your customer's insurance approves the pilot in writing, and you never pick the pilot."*

The structural rule that makes this safe (regulatory finding, reinforced by its checker): **the shop is a referral source, never the customer.** The aircraft owner signs the AMG agreement and pays AMG, even when the shop brings the lead. Money flowing shop → AMG → pilot to move an aircraft with the owner absent from the contract is the one AMG scenario that actually resembles illegal charter.

**Two ways to give the shop economics without a kickback:**
1. **Preferred:** the shop line-items "aircraft repositioning coordination" on its own work order to its own customer at whatever it likes, pays AMG $895, keeps the spread. No 1099, no disclosure problem, no commercial-bribery question — it is the shop's own pricing on a service it resold. *(Check this against §II do-not-do item 3 on the first job: the owner still signs AMG's coordination agreement and the pilot still invoices the owner. Only the coordination fee rides the shop's invoice.)*
2. If a shop wants a straight referral fee: **pay the shop entity**, against the shop's own invoice or a signed one-page referral agreement executed by an owner or officer, W-9 on file before the first dollar. **Never pay a Director of Maintenance personally.** Fla. Stat. §838.16 makes conferring a benefit on an agent to influence a breach of duty a **third-degree felony**; §838.15 makes receiving it one for the DOM. Employer consent is the dividing line. A request to keep it "off the books to keep it simple" is itself the red flag.

**Prepaid credit block as the 14-day accelerator:** $5,000 prepaid to one shop, drawing down at $795/event (~11% off). One signature clears the low end of the 14-day goal. Frame explicitly as prepaid credit, **not** guaranteed availability and **not** a subscription: *"Credits never expire. If we can't staff it, we decline and the credit stays on the books."* Have an answer ready before the pitch for the controller's question — what happens to unearned credits if AMG stops trading — because a one-person company holding deferred revenue with no segregated account will be asked.

---

## V. Channel ranking

**14-day capable, in order:**

1. **Tony's own warm network — texts and calls, one by one.** *(UNVERIFIED conversion figure: the outbound area, which was not fact-checked, cites 40–60% warm conversion vs 8–12% cold connect. Directionally right, treat the numbers as illustrative.)* This is the single most likely source of jobs one and two. Zero cost, zero deliverability risk, zero telemarketing question.
2. **Maintenance shop service writers — in person and by phone.** FXE (Banyan Air Service, Sheltair, and the independents on the field), PMP, BCT, OPF, TMB, LNA, PBI, all inside about an hour of North Lauderdale. The unchecked outbound research estimates 15–20 aviation businesses in a 2-mile on-field loop at FXE and 80–120 more across the other fields; **treat those counts as UNVERIFIED — build the actual list per §VI.**
3. **Aviation insurance brokers — phone only, ~10–20 in Florida that matter.** Underwriters, not owners, create AMG's demand: a policy reading "1,000 TT / 250 in type / 25 hours dual with a qualified mentor pilot" turns a new turbine owner into an AMG customer on day one. Script: *"When your underwriter puts a mentor-pilot or second-pilot requirement on a policy, who do you send them to today?"* The ask that gets a yes is **"add me to the list you give people,"** not "send them to me" — brokers referring a single named vendor create their own E&O exposure.

**30–90 days:** FABA member directory (statewide Florida aviation businesses, one membership call); avionics shops (long downtime = ferry legs); aircraft-management firms needing overflow; broker/dealer closers.

**6–9 months, and only once the above produce:** NBAA **Schedulers & Dispatchers, Feb 22–24 2027, Fort Lauderdale** — the one event worth exhibiting at, in Tony's home metro, in front of the exact humans who make the "our pilot called out Thursday" call. Register as an attendee now and request exhibitor pricing. Type-club partner programs (CJP via Staff@CitationJetPilots.com, TBMOPA) — request the prospectus, do not pitch; expect a four-figure minimum and a 2027 convention. Type-club forums as a member-pilot only, after 20 free technical answers.

**Do not do:**
- **MRO Americas Orlando, Apr 13–15 2027** — airline and heavy MRO, not Part 91 GA. Walk it, never book a booth.
- **NBAA membership to obtain a member list.** The directory is members-only and not scrapeable. Business Member dues are $850/yr as of May 12, 2026. One relationship with a Banyan or Sheltair CSR manager at FXE is worth more.
- **Type clubs as a demand channel for contract pilots.** COPA (~7,000 members), BeechTalk, Twin Cessna Flyer, PMOPA are owner-*pilots* who fly their own airplanes — the least likely people alive to hire a pilot. They buy the ferry product, not the crew product.
- **Facebook groups as a demand channel.** Use "Ferry Pilots and Aircraft Delivery" and similar purely as a **supply** channel to build the bench.

**Event calendar reality:** there is no Florida business-aviation event between now and February 2027. NBAA's 2026 regional forums (Miami-Opa locka Feb 25, White Plains June) are both past; next NBAA-BACE is Oct 20–22 2026 in Las Vegas; Sun 'n Fun next runs Apr 6–11 2027. **Zero dollars of the first $10k comes from a booth.**

**PAMA South Florida chapter: UNVERIFIED.** No evidence of a live chapter meeting in 2026. Do not drive to a meeting that may not exist.

---

## VI. Lead-list build, with costs

**Today, ~4 hours, $0:**

**FAA Part 145 repair stations** — free bulk download at `https://av-info.faa.gov/dd_sublevel.asp?Folder=%5CRepairStations` (tab-delimited set `aa145a`–`aa145m.zip` plus `repair.zip`). Three corrections to the research, all from its fact-checker:
- Host returned **HTTP 503** on 2026-07-24 to both the researcher and the checker — **nobody has actually opened this file.** Fallback is the AVInfo Find a Facility Dashboard at `https://www.faa.gov/av-info/facility-dashboard`.
- It is **not one spreadsheet.** It is a relational family joined on Designator and Certificate Number; accountable-manager data lives in a different member file from address data. **Budget 3–4 hours, not the 90 minutes the research claimed.**
- The downloadable set shows a **last-modified date of 2 July 2023** — potentially three years stale. Cross-check anything you are about to call against the live dashboard.

Filter STATE=FL, then delete avionics-only, component/accessory, propeller-only, and airline/OEM service centers. Realistic yield: **80–150 Florida airframe repair stations. UNVERIFIED sizing — the checker flagged it as an estimate, not a count.**

**The file's structural blind spot, and it matters more than the file:** owner-flown piston and many light-turboprop airframes are maintained by **independent A&P/IA mechanics and Part 91 shops operating under Part 43 with no repair-station certificate at all.** Those one- and two-mechanic operations at FXE, LNA, SUA, APF, OCF, LAL generate exactly the "aircraft needs to get to the shop" call and are **invisible in the 145 file.** Get them by asking FBO line managers and the local IA-renewal seminar crowd. There is no bulk file.

**Dealers and brokers:** **IADA** (`iada.aero`) — free public directory, no login. **NARA no longer exists**; it rebranded to IADA in 2018. Roughly 10–20 Florida members. Fifteen phone calls, not an email campaign.

**Dropped: harvesting seller contacts from Controller.com and Trade-A-Plane.** Controller is a Sandhills Global site whose Terms of Use expressly prohibit *"web scraping, web harvesting, web data extraction, or any other data scraping of Site Information"* and prohibit reusing Site Information *"for public or commercial purposes, including generating reports or aggregating data."* Building a 60–120 row derived prospect sheet is the aggregation the contract forbids, by script **or by hand**. Sandhills enforces it. Trade-A-Plane's terms returned **403 on fetch and remain unread** — assume the same until confirmed. Use the listings the way a buyer would: read one, pick up the phone, call that dealer about that aircraft. Do not build a database.

**Insurance brokers — verified addresses only:**
- **Sunset Aviation Insurance** — 4095 Southern Blvd, West Palm Beach FL 33406, 561-210-0244, founder Ben Peterson, est. 2012. *(verified)*
- **Aviation Assurance** — 16895 SW 59th Court, Fort Lauderdale FL 33331, 954-434-6222, est. 1983. *(verified)*
- **UNVERIFIED, confirm on their own sites before Tony reads them off a list:** Beacon Aviation Insurance (Sarasota), NextGuard, S.T. Good Insurance (the checker specifically doubts this one is Florida-headquartered), Macpherson Agency, EPIC Boca Raton, BWI Aviation.
- Aggregate directory: `globalair.com/directories/aircraft-insurance-companies-16.html`.
- The **underwriters** who actually impose pilot warranties: Global Aerospace, USAIG, Old Republic Aerospace, Starr.

**Airport tenant directories (free substitute for NBAA):** City of Fort Lauderdale (FXE), Miami-Dade Aviation Dept (OPF, TMB), Palm Beach County Dept of Airports (PBI, LNA), Boca Raton Airport Authority (BCT), Martin County (SUA), Naples Airport Authority (APF), SRQ, TPA, GOAA (ORL).

**Tooling — total under $100, week 1:**
- **Apollo.io Basic, month-to-month: $59/user/month.** *(Corrected from the research's $65. The $49 figure is annual — do not take an annual lock-in for a one-month project.)* Expect 50–60% fill on five-person repair stations; phone the rest and ask the front desk for the DOM's email, which is free and starts the sales conversation.
- **Skip Clay ($167–185/mo), Instantly ($94–194/mo functional), Snov.io.** Revisit only when adding 200+ contacts/month AND email has proven it closes.
- **Separate cold-outreach domain, ~$12/yr** (Cloudflare Registrar or Porkbun) + one Google Workspace Business Starter seat (~$8.40/mo). **Never cold-send from `information@amgaviationgroup.com`** — a spam complaint there poisons the domain carrying quotes and invoices.

**Email sending reality — this is why email is not a 14-day channel:**
- New Workspace domains are capped at **500 messages/day** until the account clears a **60-day** age gate; paid accounts then reach 2,000/day. Cite `support.google.com/a/answer/166852` for limits, **not** `answer/14229414`, which the research misattributed — that document is the bulk-sender guidance (SPF+DKIM+DMARC alignment, RFC 8058 one-click unsubscribe via `List-Unsubscribe` and `List-Unsubscribe-Post`, spam rate under 0.30% with 0.10% as the practical target, enforcement tightened November 2025) and contains **nothing** about account-age caps. **The "$100 spend" trigger is UNVERIFIED folklore** — repeated by third-party blogs, not confirmed in Google's own docs.
- Publish SPF, DKIM and DMARC (`p=none` with a `rua` address) **before the first send.** Warm 14–21 days. Cap at **20–30/day** for month one, 40–50 after, never above ~50.
- **500 contacts at 25/day is 20 working days of sending.** Earliest reply ~day 25, earliest cash ~day 40. Cold email mathematically cannot produce the 14-day number.

**CAN-SPAM:** no false headers or subject, clear opt-out honored within 10 business days, **a valid physical postal address in every message** (blocked today — `SITE.streetAddress` is a placeholder), and identification as a solicitation. No opt-in requirement for US B2B. Florida's ch. 668 provisions are largely preempted here.

---

## VII. Seven-day credibility checklist, with costs

| # | Item | Cost | Days | Why |
|---|---|---|---|---|
| 1 | **Bind CGL + aviation professional liability / E&O + non-owned aircraft liability**, $1M per occurrence, additional-insured endorsements available on request. Describe the four services **verbatim** on the application. | **UNVERIFIED premium.** Research guessed $1,500–4,000/yr; nobody confirmed a one-person non-operator coordination entity is even *bindable*. **Get three quotes.** | 1–3 | The COI is the literal gate on vendor onboarding. And **Fla. Stat. §627.409** lets an insurer rescind for a material misrepresentation in the application — even an innocent one. Understate the scope and the carrier voids after a loss. |
| 2 | **Three named, callable references** — a shop owner, a chief pilot, a fellow contract pilot. Name, title, company, cell, on a private one-page PDF given only to serious prospects. Not on the public site. | $0 | 1 | Converts "who are you" in one phone call. Outperforms every logo and membership combined. |
| 3 | **Founder page.** Real photo on a ramp or flight deck, full name, certificate level, type ratings, approximate total time, current recurrent month, home base, cell number, and the line **"Verify my certificate at the FAA Airman Registry"** (`amsrvs.registry.faa.gov/airmeninquiry/`). | $0 | 1 | `TEAM_ROSTER` currently has `credentials: null, photo: null`. FAA Reauthorization 2024 §803 lets *owners* withhold registry PII; it does not touch **airman** certificate data. Inviting verification is the move fake proof is trying and failing to imitate. |
| 4 | **Fix the four live site claims** per §II table, plus §I.1 and §I.2. | $0 | 1 | DOT §41712 consent orders are real: SportsJet $250,000 (Order 2003-12-23); Jet One Jets $60,000 (2008), DOT holding a broker *"may not create the false impression that they are direct air carriers."* FDUTPA (Fla. Stat. §501.204) adds up to $10,000/violation and **prevailing-party attorney's fees** — a cheap, fee-shifting cause of action for a defrauded shop. |
| 5 | **Vendor packet as one PDF:** W-9, COI, remit-to/ACH-wire sheet, one-page Coordination Services Agreement, and a one-page "How a maintenance ferry runs at AMG" SOP that substantiates "credential-reviewed." Attach to the first reply of every inquiry. | $0 | 1 | New vendors get paid in 45 days because of **AP onboarding**, not invoice terms. The SOP doubles as the artifact that makes a DOM believe there is a process, not just a guy. |
| 6 | **Zero testimonials until a real customer gives written permission.** | $0 | — | The FTC Consumer Reviews and Testimonials Rule (16 CFR Part 465, effective Oct 21 2024) carries civil penalties up to **$53,088 per violation**; the FTC sent warning letters to 10 companies in December 2025. One placeholder testimonial exceeds the entire 14-day revenue goal. If any job is discounted or fee-waived in exchange for a testimonial, the incentive **must be disclosed** — an undisclosed incentivized testimonial is itself a violation. |
| 7 | **Google Business Profile** (service-area business, North Lauderdale; categories Aviation Consultant / Aviation Service) + **LinkedIn Company Page** on the domain. Start the **free** D-U-N-S request at dnb.com — do not pay to expedite. | $0 | 1 | Search legitimacy. D-U-N-S arrives in ~30 days and only matters for corporate flight-department vendor onboarding later. |
| 8 | **Call Scott Ramsden at SFBAA, 954-359-0260**, ask for the next South Florida event date and guest policy. Email FABA (`faba.aero`, 407-374-3284) for the dues sheet and the member/FBO roster. | $0–150 | 1 evening | Face time with the Broward/Dade DOMs and independents who buy the first ferry. Highest real ROI of any membership. **Do not buy NBAA in week 1.** NBAA Professional Member ($430/yr) is the only national one worth buying, and only in month 2. |

**Dropped:** waiving the $495/$895 fee for the first three shops in exchange for references. The offer-pricing research is right and wins: free work anchors permanently in a small network where the referral chain repeats the price, and waiving $1,000–2,700 against a $5–10k goal is self-defeating. Use **risk reversal** instead, which costs $0 when you perform: *"If the aircraft is not at the shop on the agreed date for any reason within our control, the coordination fee is refunded in full."* Real scarcity is also available and literally true: *"I take two to three outside coordination jobs a month; my next open window is [dates]."*

---

## VIII. Outbound cadence

**All benchmark figures in this section come from the `outbound` area, which shipped WITHOUT a fact-check. Treat as directional.**

- Cold-call connect: 8–12% on a single dial. Dial-to-meeting ~2–3% (≈1 meeting per 40 dials); top performers 6–10%.
- Average **8 attempts** to reach one prospect; ~1 in 4 eventually picks up across multiple attempts. **A single voicemail is not a contact.** Build a 60–80 name list, not 400, and hit each 6–8 times across call, in-person, and email.
- Cold email reply rate has fallen to **3.43% in 2026** (from 8.5% in 2019). 58% of replies come from email #1. Optimal sequence 4–7 touches at 2–4 business days.
- Email length 50–125 words; under 80 for top performers. 2–4 word lowercase subject lines: "ferry to your shop", "N-number question", "spare pilot", "stuck airplane".
- **Against standard doctrine, state the price in the body.** A DOM's fear of a coordination vendor is an open-ended bill. "$895 flat, pilot paid by the owner directly, zero markup, no rebates" answers it in one sentence. Standard "never quote cold" advice is written for $50k SaaS with a discovery gate; this is a transaction-sized published-price service.

**Daily rhythm:** two phone blocks, **07:45–08:45 and 15:00–16:00**. Shop counters are staffed at 07:00; the middle of the day goes sideways; the DOM is back at a desk closing work orders late afternoon. Most reps dial mid-morning — don't. Spend the middle of the day on the ramp.

**Five field days:** Mon FXE full on-field loop; Tue OPF + TMB; Wed PMP + BCT; Thu PBI + LNA; Fri FXE follow-back. 10–14 doors/day, 09:15–12:30 and 13:30–15:00. One question at every service counter: *"When your customer's airplane is ready and the owner can't come get it, who moves it?"* Leave the one-pager. Get a cell number. Log it same day. Print 250 cards and 100 one-pagers same-day locally, ~$120.

**Telephone compliance — two different Florida statutes, and the research areas disagreed:**

- The **outbound** area (unchecked) concluded manual dialing keeps AMG outside the **Florida Telephone Solicitation Act**, Fla. Stat. **§501.059**. That is correct as far as it goes: the 2023 amendment (CS/CS/HB 761, signed May 25, 2023) narrowed the FTSA to calls made using an **automated system** for selection or dialing or playing a recorded message, and added a text safe harbor requiring the recipient to first reply STOP.
- The **lead-sources** fact-checker raised a **separate statute** nobody else touched: the **Florida Telemarketing Act, Fla. Stat. §§501.601–501.626.** A "commercial telephone seller" must hold an **FDACS licence under §501.605** or file an **affidavit of exemption under §501.604** (filing obligation at §501.608). The **B2B exemption at §501.604(10) does NOT cover AMG** — it requires the seller to have operated continuously **three years under the same business name** with 50%+ repeat sales to existing businesses. AMG is new. The exemption that plausibly fits is **§501.604(3)** — the seller does not make the major sales presentation by phone and completes the sale at a later face-to-face meeting.
- **Resolution: both are right about their own statute.** Manual dialing avoids the FTSA private right of action; it does not obviously avoid the FDACS licence-or-affidavit obligation. **Spend 30 minutes with FDACS before the dialing week**, determine which §501.604 exemption applies, file the affidavit, and **structure the calls to match it** — short call, set an on-site meeting, no close on the phone. That happens to be the right sales motion anyway. **UNVERIFIED which exemption applies. Confirm with FDACS or a Florida lawyer. Do not rely on "it's B2B so it's fine."**

**Federal TCPA, from the unchecked outbound area, plausible and internally consistent:** §227(b) restricts calls and texts to wireless numbers made with an ATDS or artificial/prerecorded voice; *Facebook v. Duguid*, 141 S. Ct. 1163 (2021) narrowed ATDS to equipment using a random or sequential number generator — a human typing on a phone is not an ATDS. **Ringless voicemail is treated as a call and is prohibited.** The FCC "one-to-one consent" rule was **vacated** by the Eleventh Circuit in *Insurance Marketing Coalition v. FCC*, No. 24-10277 (Jan. 24, 2025) and formally repealed in 2025 — 2026 SEO articles claiming a January 2026 effective date are wrong.

**Two cheap controls, 45 minutes total:** (1) 47 CFR 64.1200(d) requires **any** entity making telephone solicitations to maintain a written DNC policy, train personnel, and honor requests — regardless of ATDS, regardless of B2B. Write the one-pager today and log every opt-out. (2) Most small shop owners' "business" cell is legally presumed **residential** — 47 CFR 64.1200(c) protections run to residential subscribers, and *Chennette v. Porch.com* (9th Cir. 2022) created a presumption that mixed-use cells are residential. Scrub anything that looks like a personal cell against the National DNC registry (free for sellers calling under five area codes, `telemarketing.donotcall.gov`).

**Hard operating rules:** manual dial only. No auto-dialer. No bulk SMS platform. No ringless voicemail. STOP honored instantly and permanently. **Florida is a two-party consent state (Fla. Stat. §934.03)** — never record a call without saying "I'm recording this, okay?" first. Statutory damages run $500–$1,500 per message and this is Florida's #1 plaintiff-bar cottage industry.

---

## IX. Must-have contract clauses

Spend **$1,000–2,000** with a Florida aviation attorney (an AOPA Legal Services Plan panel firm or a South Florida aviation practice) for **two documents only**, scoped in writing, five business days: a Coordination Services Agreement and Independent Contract Pilot Referral terms. **Do not let this block selling** — sell with the disclaimer footer while the lawyer works.

1. **No operational control.** Owner is the operator; the PIC has final authority; AMG provides no aircraft, no Part 119/135 services, and no holding out. **Write these as conduct rules for Tony, not just recitals:** never make or influence a go/no-go, routing, fuel, weather or release decision; never source the airplane. Describe the two-invoice structure as *"consistent with, and evidence of,"* no operational control — **not as proof.** Operational control turns on who decides whether the flight goes (14 CFR 1.1), not on who cuts the check. The offer-pricing research called the invoice structure "the strongest available proof" and its checker was right to refuse that; overstating it in front of an FSDO inspector is worse than not saying it.
2. **The pilot is an independent contractor engaged by the owner.** Not AMG's employee or agent. AMG issues no 1099-NEC because AMG is not the payer.
3. **Fee terms.** Coordination fee due at engagement, non-refundable once a pilot accepts. **Delete the pass-through prepayment and true-up clauses** — AMG never holds trip funds. **Delete the "one full pilot day on cancellation" clause** — pilot cancellation terms are between owner and pilot; say so in one sentence.
4. **Delay allocation.** Weather, AOG and shop-slip days accrue pilot day rate, per diem and lodging **to the owner, payable to the pilot.** Get the actual terms by asking two contract pilots for their own standard agreements and adopting what they already expect, then handing the same terms to the client. That makes the letter defensible instead of unilateral. **Note:** the research cited a yacht-delivery firm as precedent for "reschedule rather than refund" on weather. Its checker read the source — the company offers **full refunds** on company-side weather cancellation, and the 50% forfeit is **customer-initiated only.** Drop that precedent; the prepayment-at-reservation argument survives, the retention argument does not.
5. **Insurance condition precedent.** Owner warrants the named pilot meets the open pilot warranty or is endorsed, evidenced by the broker's written email, before AMG will place the pilot. No email, no flight.
6. **Waiver of subrogation in favor of AMG on the owner's hull and liability policy.** This is the **single most valuable line in the entire document** and it was buried as a sub-item in the research. Without it, the owner's hull insurer pays a multi-million-dollar claim and then subrogates against AMG — the exact company-ending event the research claimed was already closed. Make it a standalone, non-negotiable pre-dispatch condition. Additional-insured status is worth asking for too, but **"it's usually free" is UNVERIFIED** — aviation underwriters sometimes decline or condition it for a non-owner service vendor, and additional-insured status on the owner's policy **does not cover AMG's own professional negligence in pilot selection.** That is E&O.
7. **Owner indemnity** for all claims arising from operation of the aircraft.
8. **Liability cap** at the coordination fee paid; no consequential, lost-use or replacement-lift damages. **State the limit honestly:** the cap and the indemnity bind **only the owner.** They do nothing against passengers and their estates, people or property on the ground, or the contract pilot himself. A wrongful-death or negligent-referral claim naming AMG for putting that pilot in that left seat is entirely unaffected by an $895 cap. The exposure is mitigated, not closed.
9. **Florida law, Broward County venue, prevailing-party fees.**

**Move the E&O quote to week 1, not week 2.** If no carrier will write aviation professional liability for a one-person non-operator coordination entity, then clause 8 and the waiver of subrogation are the *only* protection and become deal-breakers rather than negotiable terms. That answer changes how the whole agreement is negotiated, so get it before the first job, not after.

**Payments:** card or wire for same-day/AOG work and for every first-time customer; ACH for planned coverage, repeat shops and prepaid blocks. The research recommended "ACH-first in every quote" *and* "take the money before the pilot leaves home" — its checker showed these are mutually exclusive on exactly the jobs AMG wants: **Stripe ACH Direct Debit settles in 4 business days (2 for a fee), and a new customer must first verify the bank account — microdeposits give them up to 10 days**, or $1.50 for instant validation. Set the ACH mandate up with a repeat customer *before* the first urgent job. Fees: cards 2.9% + $0.30; ACH 0.8% capped at $5 (the cap binds at $625); $4.00 per failed ACH; $15.00 per dispute. On an $895 receivable the card/ACH delta is ~$21 — never lose a booking to save it. Card surcharging is legal in Florida (the §501.0117 ban was struck down by the 11th Circuit in 2015) but Visa caps it at 3%, debit may never be surcharged, and disclosure is required. **Do not surcharge the first ten customers.**

---

## X. What will actually kill this

**1. An insurance denial on a coordinated ferry.**
AMG sources a pilot, nobody gets written confirmation he is an approved pilot, there is a hull loss, the owner's carrier denies, and the owner sues AMG. Or the carrier pays and **subrogates** against AMG. AMG's fee on that flight was $895; the hull is seven figures.
*Early warning:* the first time a trip file goes out without the broker's email in it. The first time Tony says "he's obviously qualified, we'll get the endorsement Monday." The first time an owner says "don't bother my broker with this."

**2. The live site contradicts the legal position before anyone reads the disclaimer.**
`/for-shops` sells Fleet Agreements with tailored SLAs and monthly invoicing to **brokers**. `/pilots` promises AMG pays pilots regardless of owner payment. `/pricing` says AMG passes costs through. `/legal` references plan fees for plans that aren't sold. `/how-it-works` disclaims the response time the ticker promises. A plaintiff's lawyer, an FSDO inspector, or a claims adjuster reads the *promise*, not the footer.
*Early warning:* it is already happening. This is a present-tense failure, not a future one. If those pages are unchanged by Tuesday, this is the failure mode that materializes.

**3. Fourteen days spent on structure instead of on the phone.**
The regulatory contrarian is right: perfect compliance and $0 collected is a real outcome, and the pricing page is where founders hide from selling. There are five checklists in this document and each one is a place to disappear for a week.
*Early warning:* end of day three with zero shop conversations and a beautifully rewritten pricing page. Any day where the website was edited and the phone wasn't picked up. A fourth revision of the day-rate bands.

**4. The month-6 number is unreachable at the current fee structure and nobody notices until month 4.**
$30k/month at $895 per event is 33 coordinated events per month — 1.5 per business day, each sourced, insurance-verified and shepherded by one person who also flies a line. The 14-day goal is only reachable as **gross collected including Tony's own day rate**, which is pilot revenue, not coordination revenue — and on any self-flown trip the coordination fee must be dropped entirely for the structure to hold.
*Early warning:* month 2 revenue that is 80%+ Tony's own flying, with the coordination business flat. A month where the event count rises and the founder's available hours don't. Any month where a trip carries both a coordination fee and Tony in the left seat.

**5. Tony's ATP certificate gets caught in someone else's gray charter.**
He takes a job from a broker who was not straight with him, or from a "shop" that turns out to be arranging the whole trip including the airplane, and he is the PIC on an illegal charter he did not know he was flying. `/for-shops` currently **solicits brokers by name** — which is precisely the risk the research's own contrarian named as the founder's top personal exposure.
*Early warning:* any call where someone asks AMG to arrange the aircraft as well as the crew. Anyone who wants to pay AMG or the pilot for a flight where the aircraft owner is not the contracting party. Any request to "paper a quick dry lease" where AMG or Tony supplies the crew. Anyone who resists letting you talk to the owner's insurance broker. Anyone who wants the arrangement kept off the books.

---

### Repo files that need to change first

| File | Change | Time |
|---|---|---|
| `/home/user/amg1/app/(public)/for-shops/page.tsx` | Take down or strip to shop-as-referrer. Kill "Fleet," SLAs, fee-credit remedy, monthly invoicing, "brokers," "our owner plans" | 20 min |
| `/home/user/amg1/app/(public)/pilots/page.tsx` (lines 100–108) | Kill "pay you within 7 days whether or not the owner has paid us yet" | 15 min |
| `/home/user/amg1/app/(public)/pricing/page.tsx` (lines 26–28, 88–92) | Replace pass-through language with owner-pays-pilot-directly | 20 min |
| `/home/user/amg1/lib/site-config.ts` (lines 28–34, 126–130, 167) | Day-rate bands split by mission or removed; delete "Pilot payment — Within 7 days" from `COMMITMENTS`; verify or remove `AFFILIATIONS`; publish real `streetAddress` | 30 min |
| `/home/user/amg1/components/flightdeck/ticker.tsx` (lines 10–19) | "Ops desk" → "Calls returned same business day"; add rebate language to the markup claim | 10 min |
| `/home/user/amg1/app/(public)/team/page.tsx` (lines 14–20) | Same fixes; add founder credentials and photo (`TEAM_ROSTER` TODOs) | 30 min |
| `/home/user/amg1/app/(public)/legal/page.tsx` (line 33) | Delete "and plan fees"; rewrite fee paragraph to match the two-invoice structure | 10 min |
| `components/site/site-footer.tsx` / `lib/site-config.ts` line 24 | Extend `OPERATIONAL_CONTROL_STATEMENT` per §II; apply it to quote and invoice templates | 15 min |
| `/home/user/amg1/docs/LAUNCH_PLAN_14_DAY.md` | Rewrite from this brief | — |

Total site work: **about 2.5 hours.** Everything after that is the phone.