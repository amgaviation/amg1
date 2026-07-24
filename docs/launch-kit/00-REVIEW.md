# 00 — ADVERSARIAL REVIEW OF THE LAUNCH KIT

Reviewed 2026-07-24 against the AMG operating facts. Files reviewed: 01 through 08,
`README.md`, and `trackers/*.csv`.

**Where this review disagrees with a document, this review wins until the document is
corrected.** That is the README's own rule and I am invoking it.

**Read this first:** the compliance thinking in this kit is better than most of what I
see from operators who have been flying for money for twenty years. Document 02 is
genuinely good. The cover note to counsel in 01 is the best thing in the kit. That is
exactly why the problems below matter — a buyer who is impressed by page one will read
page four with the same attention, and page four is where the arithmetic stops working.

Nothing here is a style note. Every finding below is something that (a) an
aviation-literate buyer catches on a first read, (b) a plaintiff's lawyer or an FAA
inspector quotes back, or (c) two documents in this kit say two different ways.

---

## SEVERITY INDEX

| # | Finding | Files | Severity |
|---|---|---|---|
| 1 | The pricing model is arithmetically impossible. Four documents publish four different take rates for the same job | 03, 04, 07, 08 | **STOP** |
| 2 | AMG "clears" flights to launch | 02, 03, 04 | **STOP** |
| 3 | The fee is collected before the gate that kills the job, and no document says what happens then | 01, 03, 04, 05, 07 | **STOP** |
| 4 | The prepaid block is sold against terms that contradict the agreement, with no block agreement in existence | 08, 01 | **STOP** |
| 5 | The kit sells jets on day 1 from a bench of zero, in violation of its own rule | 05, 03, 06, 07 | **STOP** |
| 6 | "A pilot your underwriter already approved is a claim that gets paid" | 04 | High |
| 7 | "I don't have pilots. I don't keep a bench" — untrue and contradicted by 06 | 04, 06 | High |
| 8 | Fabricated statistics in customer-facing copy | 05, 04 | High |
| 9 | A pre-closing buyer named as AMG's contracting party and payer | 05 | High |
| 10 | The word "dispatch," in the document that bans it | 04 | High |
| 11 | Four different piston prices | 03, 04, 07, 08 | High |
| 12 | Complexity pricing invented on a call that exists on no price sheet | 04 | High |
| 13 | 01 says do not send it; 07 and 08 send it | 01, 07, 08 | High |
| 14 | Three different call-recording rules | 02, 04, 07, 08 | Medium |
| 15 | Rate bands published on the counter one-pager before they are substantiated | 03, README, 06 | Medium |
| 16 | Who owns the broker step — 01 says Owner, 03 says AMG and dates it | 01, 03 | Medium |
| 17 | "AMG supplies... a pilot's labor" | 03 | Medium |
| 18 | "I can have a qualified pilot committed today" | 02 | Medium |
| 19 | Worked-example percentage does not match its own table | 03 | Medium |
| 20 | Additional-insured: mandatory in 01, optional in 02 | 01, 02 | Medium |
| 21 | Retention: 7 years in 07, 10-and-permanent in 02 | 02, 07 | Medium |
| 22 | 61.55 is cited correctly; "make and model" is not the same as "type" | 02, 06, 07 | Low |
| 23 | Gate cross-reference error | 02 | Low |
| 24 | Three broken spreadsheet formulas | 07 | Low |
| 25 | The tracker cannot show whether the two hard conditions are met | 07, trackers | Low |
| 26 | `mail-merge.csv` cannot populate a single email in document 05 | trackers, 05, README | Low |
| 27 | README links a document that does not exist | README | Low |

---

# SEVERITY: STOP

## 1. The pricing model is arithmetically impossible, and the kit publishes four different take rates for the same job

**Files:** `03-capability-one-pager-and-proposal.md`, `04-call-scripts-and-objections.md`, `07-mission-sop-and-tracker.md`, `08-first-90-days.md`

Four quotes, one scenario — a one-day turboprop ferry:

> **03, Part A:** "On multi-day coverage the fee is soft-capped at 25–30% of total pilot spend."

> **03, worked example:** "on a 45-minute ferry the coordination fee runs roughly 65–80% of pilot spend."

> **04, money script:** "I cap it so I'm never taking more than about a quarter to a third of what you're paying the pilot."

> **07, Step 3:** "$895 is a 35% take on a one-day ferry and 3.7% on a fourteen-day coverage block."

**What is wrong.** The published turboprop/light jet ferry rate is $700–1,200 per day.
An $895 fee against one day of that is **75% to 128%** of pilot spend. Not 35%. Not
65–80%. Not a quarter to a third.

- The **35%** figure in 07 and 08 implies a one-day pilot spend of roughly $2,557. No
  published band produces that number on a one-day ferry. It appears to have been
  carried over from a trip-rate assumption and never re-checked against the ferry band.
- The **65–80%** in the worked example is computed against the owner-direct *total*
  ($1,110–1,360), which includes a rental car. Against pilot spend as the sentence
  actually says ($1,000–1,200), it is **75–90%**.
- The **25–30% cap** is unreachable on any one- or two-day job at published rates. To
  honor it on the worked example, the fee would have to drop to **$250–360**. On a
  one-day piston ferry at $400–600, the cap forces the fee to **$100–180** against a
  published $495.

So the one-pager promises a cap, the worked example on the same PDF breaks it by a
factor of three, and the phone script states the cap to the customer as an unconditional
promise. A King Air owner with a phone calculator finds this in about ninety seconds,
and what he finds is not a pricing problem — it is a credibility problem, in the
document whose entire job is to establish that Tony is precise.

**Fix.** The cap applies to the *day-scaled portion*, not to the base. Say that, and
stop calling the base a percentage of anything.

*03, Part A — replace the cap sentence:*

> That is AMG's coordination fee. It is one line on one invoice, and it is the only
> thing AMG charges. Days 1–2 are a flat minimum: most of the work — sourcing,
> document collection, and the underwriter submission — happens before the airplane
> moves and does not scale with the length of the trip. On a one- or two-day job the
> fee is a high share of pilot spend and it is quoted that way deliberately. From day 3
> onward the per-day addition is soft-capped so that the *total* fee does not exceed
> 25–30% of total pilot spend on coverage assignments.

*04, money script — replace "and I cap it so I'm never taking...":*

> "Beyond two days it scales — $150 a day piston, $250 a day turboprop and light jet —
> and on anything past a couple of days I cap the total so the fee stays inside about a
> quarter to a third of what you're paying the pilot. On a one-day job I won't pretend
> otherwise: the fee is a big share of a single pilot day, because the work is the same
> whether the leg is forty-five minutes or four hours."

*03, worked example — replace the "65–80%" sentence:*

> Said plainly: on a 45-minute ferry the coordination fee runs 75–90% of the pilot's
> day rate. That ratio is a function of the leg being short, not of the work being
> small.

*07, Step 3 and 08, path (a) — replace "35% take on a one-day ferry" with:*

> $895 is 75–128% of a single turboprop ferry pilot day at published rates, and 3.7% of
> a fourteen-day coverage block that is far more work. The flat fee is wrong at both
> ends; day-scaling fixes the top end and only a lower base fixes the bottom.

**Also fix, before this is repeated anywhere:** the soft cap must be applied by hand and
the applied number written into the tracker. 07 already says this. Doc 03 does not, and
doc 03 is the one the customer reads.

---

## 2. AMG "clears" flights to launch

**Files:** `02-insurance-gate-and-trip-file.md`, `03-capability-one-pager-and-proposal.md`, `04-call-scripts-and-objections.md`

> **02, §6 one-page gate:** "ALL BOXES TICKED — CLEARED TO LAUNCH / Signed \_\_\_\_ Date/time \_\_\_\_"

> **02, §6 header:** "Print it. Keep it by the phone. **No launch until every box is ticked.**"

> **03, Part B §6 table:** "| Trip file complete, launch authorized | | X |" — the X is in the AMG column.

> **02, §3 pitch:** "I'm not going to move your airplane without it, and you don't want me to."

> **02, §3 phone script:** "It's for the owner's file and mine. **I don't fly anybody without it.**"

> **04, §2 broker call:** "**I don't launch anybody** until you or the underwriter has put it in writing."

**What is wrong.** Every other document in this kit is built to prove AMG has no
operational authority. 07 opens with "Nothing in this runbook authorizes AMG to make an
operational decision." 01 §2 makes it a binding rule of conduct. And then the operating
standard ends with a signature block over the words CLEARED TO LAUNCH, and the customer
proposal puts "launch authorized" in AMG's column with a date next to it.

A signed "cleared to launch" line is the single best exhibit a plaintiff could ask for.
It is a written, dated, signed assertion that AMG released a flight. It does not matter
that the rest of the file says otherwise; this is the page with a signature on it. Same
with "I don't fly anybody," "I don't launch anybody," and "I'm not going to move your
airplane" — AMG does not fly, launch, or move anything. Those verbs belong to the PIC.
This is the exact category of language that FAA operational-control cases turn on, and
it is being used in the marketing.

**Fix.**

*02, §6 — replace the closing block:*

```
ALL BOXES TICKED — AMG COORDINATION COMPLETE. FILE CLOSED PRE-FLIGHT.
AMG makes no release, authorization, or go/no-go decision. The decision to
fly is the PIC's, and airworthiness release is the owner's and the mechanic's.
Coordination complete, signed ____________________  Date/time ______________
```

*02, §6 header — replace "No launch until every box is ticked":*

> Print it. Keep it by the phone. **AMG does not complete coordination, and does not
> tell the owner the file is ready, until every box is ticked.**

*03, Part B §6 — replace the row:*

> | Trip file complete, AMG coordination closed | | X | [date] |

*02, §3 pitch — replace:*

> "I'm not going to put a pilot in front of your airplane without it, and you don't want
> me to."

*02, §3 phone script — replace "I don't fly anybody without it":*

> "It's for the owner's file and mine. I don't coordinate a pilot without it."

*04, §2 — replace "I don't launch anybody until":*

> "I don't put a pilot on a job until you or the underwriter has put it in writing."

**Then grep the whole kit for `launch`, `move your airplane`, `I fly`, `we fly`,
`cleared`, and `authorize`, and make sure every remaining instance has the pilot or the
owner as the subject of the verb, not AMG.** 02's standing rule 1 ("no fee large enough
to launch a pilot") and 07 Step 8 ("NO EMAIL, NO FLIGHT") are fine — those describe AMG
withholding its own service, which is AMG's decision to make. "Cleared to launch" is not.

---

## 3. The fee is collected before the gate that kills the job — and no document says what happens then

**Files:** `01`, `03`, `04`, `05`, `07`

Five documents, five payment terms:

> **07, Step 6:** "Coordination fee received **before pilot sourcing effort begins in earnest**." (Step 6 of 13. The insurance gate is Step 8.)

> **01, §4:** "The fee is earned and due at engagement and becomes **non-refundable at the moment a pilot accepts the engagement**, whether or not the flight subsequently occurs." … "**Invoices are due on receipt.** Amounts unpaid after fifteen (15) days bear interest at 1.5% per month."

> **03, Part B §3:** "One line, one invoice, **due [net 15 / on completion]**."

> **04, objection 12:** "**Terms are fine on my coordination fee — that part we can talk about.**"

> **05, honest math table:** "First invoice paid, **net 15**."

**What is wrong.** Two separate problems, and the second one is the dangerous one.

**(a) The terms do not agree.** The contract says due on receipt with interest at 15
days. The proposal offers net 15 or on completion. The phone script offers to negotiate.
An owner who signs the agreement after being told "terms are fine, we can talk about it"
and then gets an invoice due on receipt with a 1.5%/month interest clause has a
straightforward argument that he was told something else. That is a small dispute over a
small amount of money with a first customer, which is the worst kind.

**(b) Nobody has written down what happens when the underwriter says no.** The SOP takes
the money at Step 6. The most likely job-killing event — the broker declining the pilot
— happens at Step 8. The agreement makes the fee non-refundable only "at the moment a
pilot accepts the engagement," which is Step 7. So on the sequence the SOP actually
prescribes, AMG holds a fee it has not yet earned under its own contract, on a job that
is about to die, with no refund clause and no partial-work clause. The first time this
happens the owner will ask for his $895 back, and the correct answer will not be in any
document.

This is not hypothetical. 02 §3 tells Tony to assume turbine endorsements fail or take
72 hours, and 07's decline path lists "the broker declines the pilot" as a live category.
The kit predicts this event and then has no term covering it.

**Fix.**

*01, §4 — replace the first paragraph:*

> Owner will pay AMG a coordination fee in the amount stated on the first page. Fifty
> percent (50%) of the fee is due on execution of this Agreement and is earned when AMG
> begins sourcing. The balance is due on the earlier of (i) the date a pilot accepts the
> engagement or (ii) completion of the engagement. The fee covers AMG's coordination
> service only. AMG's invoice will state the coordination fee as a single line item, will
> contain no markup on any third-party cost, and will include no charge stated per
> flight, per leg, per flight hour, or per mile.
>
> **If the engagement terminates because Owner's broker or underwriter declines to
> approve any pilot AMG presents, or because Owner elects not to proceed after such a
> decline, AMG will retain the earned portion and will invoice no balance.** The fee is
> otherwise non-refundable once a pilot has accepted the engagement, whether or not the
> flight subsequently occurs. Nothing in this paragraph obligates AMG to present more
> than three candidate pilots.
>
> Invoices are due on receipt unless a different term is stated on the invoice. Amounts
> unpaid after fifteen (15) days bear interest at 1.5% per month or the maximum rate
> Florida law allows, whichever is less.

*07, Step 6 — replace the gate line:*

> **Gate to next step:** 50% of the coordination fee received. Balance invoiced at pilot
> acceptance or completion per §4 of the agreement. If the underwriter declines every
> candidate, AMG retains the earned 50% and invoices nothing further — say this on the
> scope call, before taking the first payment, not after the decline.

*03, Part B §3 — replace "due [net 15 / on completion]":*

> Half on signature, half at pilot acceptance. One line, one invoice, no markup, no
> percentage of pilot pay, no rebates from any vendor. If your underwriter declines every
> pilot I put in front of them, you owe the first half and nothing more.

*04, objection 12 — replace "Terms are fine on my coordination fee — that part we can talk about":*

> "On my fee it's half on signature and half when the pilot accepts. That part's fixed —
> it's in the agreement — but the second half only lands if there's a pilot to send."

That last version is also a better sales answer than the original, because it tells the
owner his downside is capped.

---

## 4. The prepaid credit block is sold against terms that contradict the agreement, and no block agreement exists

**Files:** `08-first-90-days.md`, `01-coordination-services-agreement.md`

> **08:** "Unearned credit is **refundable in cash on 30 days' written notice, for any reason, at any time** — you do not have to give a reason and you do not have to have used any of it. … **That refund right is written into the block agreement**, and the balance is stated on every invoice."

> **01, §4:** "The fee is earned and due at engagement and becomes **non-refundable**…"

> **01, §11:** "This Agreement … **is the entire agreement** between the parties as to its subject matter and supersedes all prior discussions."

> **08:** "Talk to a CPA about revenue recognition **before you sell the second block.**"

**What is wrong.**

1. **The block agreement does not exist.** 08 says the refund right "is written into the
   block agreement." There is no block agreement anywhere in this kit, it is not in the
   two-document scope Tony gave counsel in 01's cover note, and the budget he quoted
   ($1,000–2,000 for two documents) does not include a third. Doc 08 schedules the first
   block sale inside Days 15–45. Counsel's turnaround is quoted at one to three weeks.
   On the current plan, Tony sells a $5,000 prepayment against a document nobody has
   drafted.
2. **The integration clause kills the promise.** If the block terms live outside the
   Coordination Services Agreement and the owner signs the CSA for each event, §11 says
   the CSA supersedes prior discussions on its subject matter. An owner arguing for his
   refund and a lawyer arguing against it now have something to fight about, which is the
   opposite of what a $5,000 prepayment should produce.
3. **"Sell the first one, then ask the CPA"** is backwards. Unearned customer money on
   the books of a one-person company is exactly the thing to ask about before, not after.

**Fix.** Either cut the block from the 90-day plan entirely, or make it a fourth item in
the counsel engagement and do not sell one until it comes back. My recommendation is the
second, with a hard sequencing gate.

*08 — insert immediately before "**Offer:** $5,000 paid up front":*

> **Blocked until counsel delivers a block agreement.** Do not sell a block, quote a
> block, or mention a block price to a customer until a written Prepaid Coordination
> Credit Agreement exists, containing at minimum: the refund right below stated verbatim,
> an express statement that credit is applied only against AMG coordination fees for
> aircraft the buyer owns, the block's precedence over the integration clause in §11 of
> the Coordination Services Agreement, and the balance-on-every-invoice obligation. Add
> it to the counsel engagement in document 01 as a third document and expect the budget
> to rise accordingly. Selling a prepayment against a document that does not exist is how
> a small company acquires its first genuinely bad problem.

*01, cover note to counsel — add to "Scope of the engagement":*

> 3. **Prepaid coordination credit agreement** — a short document under which an aircraft
>    owner prepays a capped balance (currently $5,000) drawn down against per-event
>    coordination fees. It must state that unearned credit is refundable in cash on 30
>    days' written notice for any reason, that the balance appears on every invoice, that
>    credit applies only to aircraft the buyer owns, and that its terms survive the
>    integration clause in Section 11 of the agreement above. I have not drafted this. Tell
>    me what it does to the budget and whether Florida treats an unearned balance like this
>    as anything other than an ordinary contractual liability.

*08 — also add, under the "do not spend the float" paragraph:*

> Hold unearned block balances in a separate bank account from operating cash. A sentence
> telling yourself not to spend the float is not a control; a second account is.

---

## 5. The kit sells jets on day one from a bench of zero, in direct violation of its own rule

**Files:** `06-pilot-bench-recruiting.md`, `05-email-sequences.md`, `03`, `07`

> **06, §5.4:** "If a category is not three deep, **AMG does not put it in a proposal, does not name it on a call, and does not imply it on the website.**"

> **06, §5.2 timeline:** light jet three-deep and "at least one light jet pilot who has actually been through an underwriter approval" — **Day 90**.

Now what the customer-facing documents do on day one:

> **05, seq 1.1 (Day 1 cold email):** "$895 flat for turboprop and light jet, $495 piston."

> **05, seq 4.1 (Day 1 cold email):** "$895 turboprop and light jet, days one and two."

> **03, Part A:** publishes light jet trip rates and "Phenom 300, CJ3+/CJ4, PC-24: quoted individually."

> **07, scorecard:** a close in Week 3.

And the sentence that ties it in a bow:

> **06, §0:** "The coordination fee is what an owner pays for the fact that **a qualified, insurance-approved pilot exists before the phone call**, not after it."

**What is wrong.** 06 §5.4 is the correct rule and it is the rule the rest of the kit
breaks on page one. The first cold email quotes a light jet price. The one-pager left on
shop counters in Week 1 prices Phenom 300 and CJ4 work. The bench on Week 1 is zero
pilots in every category. Doc 06 is explicit that three-deep in light jet is a Day 90
milestone.

The §0 sentence is worse than an inconsistency — it is false as written and it is
contradicted twice inside its own document. 06 §4.1: "Nothing in this file may be treated
as pre-approval." 06 §4.3: broker approval is "policy- and trip-specific; never transfers
between owners or trips." 02 §6 says the same thing. No insurance-approved pilot exists
before the phone call. Cannot. That is the whole architecture of the gate. A broker who
reads that sentence concludes Tony does not understand his own product; an owner who
reads it and later learns the truth concludes he was sold something that did not exist.

**Fix.**

*06, §0 — replace the sentence:*

> The coordination fee is what an owner pays for a qualified pilot being *findable* on
> the day he calls, and for that pilot's file reaching his underwriter complete and
> first time. Approval itself is always trip-specific and always after the call — that is
> what the gate in `02` is. The bench is what makes the gate fast, not what lets it be
> skipped.

*05 — remove light jet pricing from every Day 1 touch until the bench supports it.* In
seq 1.1, 3.1 and 4.1, replace the pricing sentence with the piston/turboprop version only:

> My invoice is one line: $495 piston, $895 turboprop, days one and two. No markup on
> anything, no rebates to anyone.

*03, Part A — add immediately under the price table:*

> Light jet and type-specific work (Phenom 300, CJ3+/CJ4, PC-24) is quoted individually
> and is accepted only where AMG can staff it. AMG will say on the first call whether a
> category is one it can staff, before anything is quoted.

*06, §5.4 — strengthen, because this rule is the one the rest of the kit is going to
push against hardest:*

> If a category is not three deep, AMG does not put it in a proposal, name it on a call,
> print it on the one-pager, or quote it in an email. **This rule binds documents 03 and
> 05 as well as this one.** Before any price sheet or email sequence goes out, check the
> Tab 2 bench counts by category and delete every category that is not three deep. The
> correct sentence to an owner is: "That's outside what I can staff right now. I'd rather
> tell you that than take the job and miss."

---

# SEVERITY: HIGH

## 6. "A pilot your underwriter already approved is a claim that gets paid"

**File:** `04`, objection 3

> "A pilot your underwriter already approved is a claim that gets paid. A pilot nobody told them about is the claim that turns into a coverage fight."

**What is wrong.** The second sentence is true and useful. The first is an unqualified
promise about coverage outcomes made by a person who is not the carrier, not the broker,
and not licensed to interpret the policy. Claims are denied for a hundred reasons that
have nothing to do with pilot approval — airworthiness at the time of loss, an excluded
use, a permit limitation the flight busted, late notice, a material misrepresentation in
the owner's own application. An owner who hears this sentence, has a claim denied on
another ground, and can produce a call log or an email repeating it has a
misrepresentation claim against AMG that the $895 liability cap in 01 §9 does not touch,
because it is not a contract claim.

This is also the one place in the kit where the language discipline slips in the exact
direction 02 §0 warns about: it converts "we put it in front of your broker" into a
promise about what the insurer will do.

**Replacement:**

> "Then it's a hull claim on your policy, same as if you'd hired him yourself — which is
> exactly why I won't move without your broker naming him in writing first. I can't tell
> you how a carrier will handle a claim; nobody outside that carrier can. What I can tell
> you is that 'the pilot was never approved' is one of the arguments they can make, and
> it's the one argument I can take off the table before the airplane moves."

---

## 7. "I don't have pilots. I don't keep a bench."

**Files:** `04` objection 6, `06`, `07` Tab 2

> **04:** "I don't have pilots. **I don't keep a bench** and I'm not going to quote you a roster number…"

> **06, §0:** "**The bench is the product.**" — and the entire document is titled *Pilot Bench Playbook*, with targets of 18–22 pilots and a rule of three.

> **07, §4.3:** "TAB 2 — `PILOT BENCH`. **The bench is the inventory.**"

**What is wrong.** It is a false statement of fact to a customer, contradicted by two
other documents and by a spreadsheet tab. The instinct behind it is right — do not quote
a roster number, because a number tells the owner nothing. But the execution says
something untrue in order to avoid saying something unimpressive, and the day an owner
learns there is a bench (a pilot mentions it, a shop mentions it, doc 06 leaks) the whole
"you don't have to trust my history, check my work" posture from objection 7 collapses.

**Replacement:**

> "I keep a bench, and I'm not going to quote you a number off it — a roster count tells
> you nothing about whether anybody on it is current in your airplane and clears your
> policy. Some of them would be right for a King Air and none of them would be right for
> your Baron.
>
> What I do is source to the airplane. You tell me it's a King Air 350 out of Fort
> Lauderdale on Thursday, and I go to the people on my bench who are current in a 350 and
> will clear your open pilot warranty — and if nobody on it does, I go outside it and
> tell you that's what I'm doing. If I can't find one that clears, you hear that the same
> day instead of getting strung along."

---

## 8. Fabricated statistics in customer-facing and decision-driving copy

**File:** `05`, and one in `04`

> **05, header:** "Touch 1 carries the sequence; **58% of replies come from it**."

> **05, honest math table:** "First replies arrive (**touch 1 pulls 58%**)."

> **05, seq 4.2 (sent to chief pilots):** "**about half the departments I talk to** are still requiring the rating and paying for it."

> **04, objection 5:** "it's maybe **four to six hours of your time** and one phone call to an underwriter."

**What is wrong.** The 58% is a number AMG has not measured and cannot measure — it has
sent zero emails. It appears twice, and the second time it is load-bearing in a timeline
Tony is supposed to plan against. Doc 05's own rules say "No unsubstantiated claims
anywhere in these sequences." Doc 07 Step 4 says the same. Doc 03 says the same. The
document is breaking its own rule in its own header.

The 4.2 email is worse, because it goes to an audience that will test it. "About half the
departments I talk to" tells a chief pilot that Tony has surveyed a meaningful number of
flight departments on SIC type ratings. He has not. Chief pilots in South Florida know
each other. The first one who asks "which departments?" gets an answer that ends the
relationship, and this is a market of a few hundred people — 06 §7.3 says so explicitly.

**Replacements.**

*05, header:*

> Touch 1 carries the sequence, so it states the price and the structure in the body
> rather than gating them behind a call. Track reply-by-touch from the first send and
> re-baseline this document at 200 sends against real numbers rather than assumptions.

*05, honest math table:*

> | First replies arrive | 23–25 | ~day 33–36 |

*05, seq 4.2 — replace the second paragraph:*

> For your domestic Part 91 SIC seat, are you holding contract right-seaters to 61.55(b)
> currency inside twelve calendar months, or asking for an SIC type rating? 61.55(a)(3)
> exempts domestic US operations, and it's the item I see confused most often.
>
> Curious where {{company}} lands on that.

*04, objection 5:*

> "If you want to run it yourself, you can — it's a morning of your time and one phone
> call to an underwriter you may not have a relationship with."

---

## 9. A pre-closing buyer named as AMG's contracting party and payer

**File:** `05`, Sequence 3 header and 3.1

> **Header:** "When the dealer does not hold title, **the seller or buyer contracts** and the dealer is a referral source."

> **3.1:** "If you hold title you contract with me directly; if you don't, the owner does. Either way **the pilot is paid direct by whoever holds title**…"

**What is wrong.** The header and the email body contradict each other, and the header is
wrong. A **buyer** who has not closed does not hold title, is not the registered owner,
and is not a lawful lessee in possession. He is exactly the "anyone who is not the
aircraft owner" that the do-not-do list bars AMG from taking payment from. Pre-buy and
delivery ferries are also the single most scrutinized moment in a small-aircraft
transaction — who owned it, who insured it, who was flying it — and having AMG's
contracting party be the wrong side of the closing is a fact pattern that shows up in
litigation regularly.

01 §21 already gets this right: Owner is "the registered owner or the lawful lessee in
possession." The email sequence undoes it.

**Replacement, Sequence 3 header:**

> Careful audience. **AMG's contracting party is always whoever holds title on the day of
> the flight** — the registered owner or a lawful lessee in possession, and nobody else.
> When the dealer holds title, the dealer is the owner and contracts with AMG directly.
> When the dealer does not, the **titleholder of record on the flight date** contracts —
> usually the seller on a pre-buy, sometimes the buyer on a post-closing delivery. A buyer
> who has not closed is not the owner and cannot be AMG's customer or payer, however
> convenient it would be. The dealer is a referral source. Never quote one all-in
> delivered price for moving an airplane. Never imply AMG can supply an airplane.

**Replacement, 3.1 body sentence:**

> When a {{company}} airplane needs to get to a pre-buy or out to a buyer, I source the
> pilot. Whoever holds title on the day of the flight contracts with me and pays the pilot
> direct — if that's you, it's you; if it's the seller, it's the seller. My invoice is one
> line — $895 turboprop, $495 piston, days one and two.

**Add to 05, Reply Handling:**

> ### "We'll close next week — just bill us"
>
> No. The contracting party is whoever is on the registration on the flight date.
>
> > I can only contract with the titleholder on the day it flies. If it's still the
> > seller's airplane that morning, the seller contracts with me and pays the pilot, and
> > it moves under the seller's policy. If you want it under your name and your binder,
> > we fly it after closing. Either is fine — they just can't be mixed.

---

## 10. The word "dispatch," in the document that bans it

**File:** `04`

> **Ground rules, line 5:** "Never say 'dispatch.' AMG coordinates."

> **Disqualifiers table, 22 rows later:** "He won't provide a waiver of subrogation in favor of AMG. | **Pre-dispatch condition**, not a negotiation."

**What is wrong.** Do-not-do item 8 is "use the word 'dispatch' for what AMG does." This
is an internal document, but internal documents get pasted into emails, and a disqualifier
table is exactly the thing Tony reads off out loud on a call. The phrase also appears in
the operating facts themselves; that is where it came from, and it needs correcting there
too.

**Replacement:** "**Pre-launch condition**, not a negotiation."

Grep the whole kit for `dispatch`. The only permitted uses are the ones describing what
AMG is *not* — 01 §1's "flight dispatch service," 07 Step 10's instruction not to use the
word, and 04's ground rule. Everything else changes to "pre-launch," "coordination," or
"before the pilot is placed."

---

## 11. Four different piston prices

**Files:** `03`, `04`, `07`, `08`

> **03, Part A and 05, three emails:** "$495 piston."
> **07, Step 3:** "expect to **discount toward $350–395**."
> **08, path (a):** "**Piston starts at $295–$395** or piston comes off the price list."
> **04, objection 8:** "**What I won't do is cut the fee** and cut the file."

**What is wrong.** The printed one-pager left on shop counters says $495. The SOP tells
Tony to discount to $350–395 on exactly the job the one-pager is aimed at. The 90-day plan
says the real number is $295–395. And the objection script has Tony telling the customer
he does not discount — which he then does, per the SOP, on the same call.

Two owners at the same FBO comparing invoices is not a hypothetical in a market this
small. Worse: a customer who paid $495 after being told "I don't cut the fee," who then
learns the price sheet moved to $395 six weeks later, is a customer who tells his shop
about it.

**Fix — decide once, before the one-pager is printed.** The kit's own analysis (07 Step 3,
08 path (a)) is that $495 is unsellable. Then do not print $495.

*03, Part A price table:*

| | Days 1–2 | Each additional day |
|---|---|---|
| Piston | $395 | +$150 |
| Turboprop and light jet | $895 | +$250 |

*Update the same number in 05 seq 1.1, 3.1, and the "Send me info" reply; in 07 Step 3;
in 08 path (a); and in 04's money script and objection 5 heading.*

*07, Step 3 — replace the discount instruction:*

> **$395 piston is the price, not the starting point.** It is already set near the floor
> of what this segment bears against a $400–600 pilot day. Do not discount it job by job;
> if it will not sell at $395, that is data about the segment, not a negotiation. Record
> any exception and the reason — a pattern of exceptions means the number is wrong and
> gets changed on the price sheet, not on the call.

*04, objection 8 — the "what I won't do is cut the fee" line can stay, and becomes true.*

---

## 12. Complexity pricing invented on a call that exists on no price sheet

**File:** `04`, objection 8

> "My fee I'll scope, not discount. If it's a straight repositioning on an airworthy airplane and your broker already covers the pilot under the open pilot warranty, there's less work in it and the number reflects that. **If it's out of annual with a permit and an endorsement, there's more, and it's going to cost more.**"

**What is wrong.** There is no permit-ferry surcharge anywhere. 03, 07 and 08 all price
strictly by aircraft class and day count. This script promises the owner a number above
$895 for a permit ferry that no document supports and no invoice will match, and it does
it in the same breath as promising a number below $895 for a simple one — which is the
discounting that objection 8 exists to refuse.

**Fix — either add the line item or delete the sentence.** I would add it, because the
premise is correct: a permit ferry genuinely is more work, and it is the job AMG is
targeting.

*Add to the 03 price table and to 07 Step 3:*

> **Permit ferry supplement: +$250.** Applies when the flight moves under a special
> flight permit — the broker's ferry acknowledgment, the 8130-7 and its operating
> limitations, and the pilot's written confirmation he has read them are additional work
> that happens on every permit job and no other job.

*04, objection 8 — replace the middle paragraph:*

> "My fee I'll scope, not discount. Days one and two are the base by aircraft class,
> there's a per-day number past that, and a permit ferry adds $250 because a permit ferry
> is a real extra piece of work — your broker has to acknowledge the ferry in writing and
> the 8130-7 and its limitations have to be in the file before anyone walks out to the
> airplane. Tell me which one you've got and I'll price the actual job off the same sheet
> everybody else gets."

---

## 13. Document 01 says do not send it. Documents 07 and 08 send it.

**Files:** `01`, `07`, `08`

> **01, header:** "**Do not sign it or send it to a customer until counsel has cleared it.**"

> **08:** "**Do not wait for it to come back before selling.** … If a job appears before the redline is back, **sell it on the draft** with those four items intact, and tell the customer plainly that the agreement is in final legal review."

> **07, Step 4:** "**Produces:** The written proposal (document 03) **and the Coordination Services Agreement (document 01), emailed together.**"

> **08, Week 0:** "A signable Coordination Services Agreement (doc 01) — your version, **pre-counsel** … PDF exists, e-sign link tested."

**What is wrong.** These cannot all be operative. 08's commercial judgment is right —
fourteen days of not selling while a lawyer reads is fourteen days wasted, and the redline
is better with real objections attached. But leaving the "do not send it to a customer"
header in place while the plan instructs Tony to send it creates the worst of both: he
does the commercially sensible thing, and there is a document in his own files saying he
knew he should not. If this ever gets read by an opposing lawyer, the header is the
exhibit, not the shield.

**Fix — change the header to match the plan and put a real condition on it.**

*01, replace the header block:*

> **DRAFT — NOT YET CLEARED BY COUNSEL. This is not legal advice. It was drafted by AMG
> Aviation Group for review, correction, and execution-approval by a licensed Florida
> attorney.**
>
> **Until counsel's redline is back, this draft may be sent to a prospective customer and
> signed only if all of the following are true:** (1) the customer is told, in writing in
> the transmitting email, that the agreement is in final legal review and may be reissued;
> (2) Sections 2 (No Operational Control), 6 (Insurance Condition Precedent), 7 (Waiver of
> Subrogation), and the single-line coordination fee in Section 4 are present and
> unaltered; and (3) AMG's own liability and E&O coverage is bound. **Do not alter this
> draft to close a deal.** Any customer-requested change waits for counsel.

*08, in "The lawyer" section, replace "sell it on the draft with those four items intact":*

> If a job appears before the redline is back, sell it on the draft under the four
> conditions printed at the top of document 01 — including the sentence in the covering
> email that the agreement is in final legal review. Send that email; do not say it on the
> phone only.

---

# SEVERITY: MEDIUM

## 14. Three different call-recording rules

> **02, §4 trip file:** "Florida is two-party consent for recording (Fla. Stat. §934.03). **Do not record calls.** Write notes instead."
> **04, ground rules:** "Do not record a call **unless both sides have said yes on the recording**."
> **07, §5.1 and Step 11:** "Do not record a call **unless everyone on it has consented on the recording**."
> **08, FDACS section:** "**and no call recording** — Florida is two-party consent under §934.03."
> **01, §11:** "Neither party will record any telephone conversation with the other without the prior consent of all parties to the call."

All five are legally defensible. Only one can be the operating rule, and a one-person
company under time pressure should not be making a consent judgment on a live call.
02's and 08's version is the right one.

**Fix — make 04 and 07 match 02:** "**Do not record calls.** Florida is two-party consent
(Fla. Stat. §934.03) and the exposure is not worth the convenience. Write notes the same
day instead — it is faster anyway." Leave 01 §11 as drafted; a contract clause covering
the counterparty is a different thing from AMG's own operating rule.

## 15. Rate bands published on the counter one-pager before they are substantiated

> **README:** "Every published day rate in these documents is a benchmark, not a commitment. **Do not publish a rate band until twelve pilots have confirmed their number in writing.**"
> **06, §5.2:** twelve written confirmations complete — **Day 60**.
> **03, Part A:** publishes all four pilot day-rate bands, on the PDF that is "printed copy left on every shop counter" in Week 1.

The one-pager is the single most-published artifact in the kit and it is the one carrying
the unsubstantiated numbers. Fix by labeling, not by deleting — an owner needs a number.

*03, Part A — replace the lead-in to the rate list:*

> **The owner pays the pilot directly.** AMG does not hold, route, advance, or rebill trip
> funds. Pilot day rates are the pilot's own and are quoted to you as a range before
> anyone commits. The ranges below are current market observation, not AMG's price and not
> a quote — the pilot's own number governs and is confirmed in writing before you approve
> anything:

## 16. Who owns the broker step — 01 says the Owner, 03 says AMG and puts a date on it

> **01, §6:** "**Owner will cause its broker or underwriter to confirm** subsection (b) in writing … and **Owner will deliver a copy of that email to AMG** before the pilot is placed."
> **03, Part B §2:** "**AMG** sends that qualification package directly to your insurance broker at [broker contact] and **requests written confirmation**…"
> **03, Part B §6 table:** "| Broker written approval received | | **X** | [date] — 24–72 hrs on turbines |" — the X is AMG's.

The contract makes it the owner's obligation. The proposal makes it AMG's deliverable and
assigns it a date. 02's email templates have Tony sending them, which is the practical
reality and the right one commercially — but it means AMG has promised an outcome
controlled entirely by a third party, on a schedule, in a signed proposal.

**Fix — AMG owns the submission, the owner owns the obligation, nobody owns the answer.**

*03, Part B §6 — replace the row:*

> | Qualification package submitted to broker | | X | [date] |
> | Broker written approval received (owner's carrier controls this date) | X | | [date] — 24–72 hrs typical on turbines, not a commitment |

*01, §6 — add after the first sentence of the second paragraph:*

> AMG will assemble and submit the pilot's qualification package to Owner's broker or
> underwriter on Owner's behalf and will pursue a written response, but the obligation to
> obtain the confirmation is Owner's, and AMG does not warrant that any broker or
> underwriter will respond, respond favorably, or respond within any period.

## 17. "AMG supplies... a pilot's labor"

> **03, Part A:** "**AMG supplies coordination and, on request, a pilot's labor.** The owner supplies the airplane."

01 §3 says the opposite: each pilot "contracts directly with Owner as an independent
contractor and is not an employee, agent, servant, partner, joint venturer, or
subcontractor of AMG." AMG does not supply the pilot's labor; the pilot does, to the
owner. The only labor AMG supplies is Tony's own, under a separate agreement.

This sentence sits four lines above the sentence about never furnishing the aircraft, and
"supplies labor + owner supplies the airplane" is uncomfortably close to describing the
two halves of a package. Do not hand anyone that construction.

**Replacement:**

> AMG is not an air carrier, not a charter operator, not a Part 135 certificate holder,
> not a management company, and not an air charter broker. **AMG never furnishes the
> aircraft.** AMG coordinates — it finds pilots, confirms their qualifications, and puts
> them in front of your underwriter. The pilot contracts with you and is paid by you. The
> airplane is yours. Where Antonio Gonzalez flies the trip himself, he is engaged
> personally as a contract pilot under a separate agreement and no coordination fee is
> charged.

## 18. "I can have a qualified pilot committed today"

> **02, §3:** "I can have a qualified pilot committed today. What I can't compress is your underwriter naming him in writing…"

The rhetorical structure is excellent — concede the thing you control, hold the line on the
thing you do not. But the concession is a guaranteed-availability claim, made against a
bench that is currently zero and that 06 does not expect to be three-deep in turboprop
until Day 60. The kit's own rules bar guaranteed availability in six places.

**Replacement:**

> "The part I can move fast on is finding the pilot — often same day. What I can't
> compress is your underwriter naming him in writing, and that's the piece that keeps your
> hull claim from being denied. On a jet that's typically one to three business days. I'll
> send the package to your broker within the hour of having a pilot and push it every day
> until it's back."

## 19. The worked example's percentage does not match its own table

Covered in finding 1, restated here because it is a standalone arithmetic error a buyer
will catch: "roughly 65–80% of pilot spend" is computed against $1,110–1,360, which
includes $110–160 of rental car. Against the pilot line ($1,000–1,200) it is 75–90%.

## 20. Additional insured: mandatory in the agreement, optional in the file

> **01, §7:** "Owner **will** additionally cause AMG Aviation Group to be named as an additional insured on Owner's aircraft liability policy… **evidenced on the same certificate.**"
> **02, trip file 01-Owner:** "Owner's COI showing AMG as additional insured **where obtained**."

01 makes it a term. 02 makes it a nice-to-have. Since 01 §7's opening line declares the
whole section "a standalone, non-negotiable condition of AMG's performance," the file
standard must not quietly downgrade half of it. Note also that Tony's own cover note
already suspects AI status does not reach AMG's professional negligence — that is correct,
and it is a reason to keep the requirement *and* buy E&O, not a reason to soften it.

**Fix, 02:** "Owner's COI naming AMG as additional insured on the liability policy |
Owner's broker | Required by §7 of the agreement alongside the waiver of subrogation.
Obtained before launch, on the same certificate. If a carrier refuses, that is a decision
for Tony on that job, recorded in `05-Comms` with the reason."

## 21. Retention: seven years in 07, ten-and-permanent in 02

> **02:** full trip file 7 years; **approval emails, waiver of subrogation, coordination agreement — 10 years or permanently**; permit ferry file 10 years; declined-request log permanently.
> **07, §3.1:** "Retain **seven years** — beyond any plausible statute of limitations on a hull claim or a subrogation action."

02 is right and 07 is the document Tony will actually work from at closeout. Also, 07's
justification is shakier than 02's: Florida's negligence limitation is now two years and
written contract five, so seven years clears those — but the documents worth keeping
longest are the ones that decide whether AMG is a defendant at all, which is 02's point.

**Fix, 07 §3.1:** "Retain per the schedule in `02-insurance-gate-and-trip-file.md` §4:
seven years for the full file, ten years or permanently for the broker approval email, the
waiver of subrogation, the coordination agreement, and any permit ferry file. Storage is
free; reconstruction is impossible."

---

# SEVERITY: LOW — precision, mechanics, and things that will annoy you later

## 22. The 61.55 citation is correct. "Make and model" is not.

I checked this one against the regulation because the kit cites it fifteen times and
coaches Tony to correct brokers with it — 02 §5.2 calls it "a credibility moment."

**It is right.** 14 CFR 61.55(a)(3) requires an SIC to hold "at least a pilot type rating
for the aircraft being flown **unless the flight will be conducted as domestic flight
operations within the United States airspace**." The kit's formulation — 61.55(b)
currency inside 12 calendar months, no SIC type rating required domestically per
61.55(a)(3) — is accurate everywhere it appears. Leave it exactly as written.

Two precision notes for the day a broker pushes back:

- **61.55(b) attaches to aircraft *type*, not make and model.** 02's Gate 4 says "in that
  type" and is correct. 06 §4.3 and §7.1.3 say "per make and model," and 07's Tab 2 header
  is `61.55(b) Currency Date` with no type qualifier. Make and model is an underwriting
  concept; type is the regulatory one, and they are not always the same object. Change
  06's two instances to "in that aircraft type" and add "— per aircraft type" to the Tab 2
  column note. Track make-and-model time separately, because that is what the underwriter
  actually decides on, and 02 §3.2 is right that it is usually the binding constraint.
- **61.55(a)(1) requires only a private certificate to serve as SIC.** The Commercial/ATP
  floor comes from 61.113(a) and compensation, not from 61.55. 02's Gate 1 gets this
  exactly right. If a broker or an owner says "the reg only requires a private pilot for
  the right seat," he is reading 61.55(a)(1) correctly and missing that the pilot is being
  paid. That is the answer, and it is worth adding to 02 §5.2 as a one-liner:

> If someone quotes you 61.55(a)(1) — "an SIC only needs a private certificate" — they are
> reading the right rule. 61.55 sets the crew qualification; 61.113(a) is what bars a
> private pilot from being *paid* for it. Both apply.

## 23. Gate cross-reference error

> **02, Gate 1, disguises list:** "'He's only the second pilot, he's not PIC.' **Then Gate 5 applies**, and the underwriter question in Section 5 has to be answered."

Gate 5 is W-9 and non-owned COI. The SIC gate is **Gate 4**. The "Section 5" reference is
correct. Replace with "Then Gate 4 applies, and the underwriter question in Section 5 has
to be answered before anything moves."

## 24. Three broken spreadsheet formulas in 07

```
Permit ferry share  =COUNTIF($R:$R,"Yes")/COUNTA($A:$A)-1
```
Operator precedence — this divides, then subtracts 1, returning a negative number forever.
Should be:
```
Permit ferry share  =IFERROR(COUNTIF($R:$R,"Yes")/(COUNTA($A:$A)-1),"")
```

```
Piston-ready & complete  =COUNTIFS($AB:$AB,"COMPLETE",$AA:$AA,"Active")
```
No piston filter — this counts every complete active pilot, so it always equals or exceeds
the turbine count and is labeled wrong. Either rename it `Bench complete & active` or add a
category column to Tab 2 and filter on it. Tab 2 has no category column at all, which is
the deeper problem: 06 §5.1 sets targets by six categories and Tab 2 cannot count them.
**Add column AD `Categories` (multi-value: `Piston / Turboprop / Light Jet / Trip / Mentor-SIC`)
and count against it**, otherwise 06's rule of three and 07's Friday bench audit cannot be
executed.

```
Close rate  =COUNTIF($I:$I,"12 Closed - Delivered")/COUNTIFS($I:$I,"<>01 Inbound",$I:$I,"<>")
```
The denominator excludes every row still at Inbound, which inflates close rate whenever the
top of the funnel is healthy — exactly when you most want an honest number. Use
`COUNTIFS($I:$I,"<>")` as the denominator, or measure from Qualified onward and say so.

## 25. The tracker cannot show whether the two hard conditions are met

Tab 1 (`PIPELINE`) has no column for the waiver of subrogation and none for broker
approval. Both appear in Tab 3 only — *after* the job is delivered. So on the morning of a
launch, the spreadsheet that runs the business cannot answer the two questions that decide
whether the launch is allowed. 02's paper gate answers them; the tracker should not require
Tony to go find the paper.

**Add to Tab 1, after column M:**

| # | Header | Type / values |
|---|---|---|
| N | `Waiver of Subrogation Rcvd` | `Yes` / `No` / `Requested` — pre-launch condition |
| O | `Broker Approval Rcvd` | `Yes` / `No` / `Submitted` — date in Notes |

Re-letter the remaining columns and update the dashboard formulas. Add a conditional
format: red fill on any row at stage `10 Briefed` or later where either column is not `Yes`.
That single rule is worth more than the rest of the dashboard combined.

## 26. `mail-merge.csv` cannot populate a single email in document 05

```
Email,First name,Company,Segment,Field,Personalization
```

Document 05 requires `{{first_name}}`, `{{company}}`, `{{city}}`, `{{home_field}}`,
`{{type_common}}`, `{{agency_name}}`, `{{tail}}`, `{{referral_source}}` — and says "Any row
with a blank required field does not send." `city`, `home_field` and `agency_name` are all
marked required and none of them exist in the CSV. Every row fails the send rule as written.

**Replace the header row with:**
```
email,first_name,company,city,home_field,type_common,agency_name,tail,referral_source,segment,notes
```

Also, README says "Columns match the spec in document 07 exactly." `mail-merge.csv` is not
in document 07's spec at all — it belongs to 05. Fix the README sentence to say so.

## 27. README links a document that does not exist

> **README:** "| 09 | [Prospect List](09-prospect-list.md) | Starter contacts in calling order, each marked VERIFIED or UNVERIFIED. |"

There is no `09-prospect-list.md`. Either write it or cut the row. Given that 08's Days 1–14
plan runs on the warm network and shop visits and 07's daily rhythm needs 12–18 names on
paper by 07:00, the list is the missing operational input, not a nice-to-have — write it.

---

# DOCUMENT-BY-DOCUMENT VERDICT

**01 — Coordination Services Agreement.** Strong. §2, §6 and §7 are doing real work and the
conduct rules in §2 are drafted as conduct rules rather than recitals, which is the right
call. Fix the fee terms (finding 3), the header (13), the broker obligation (16), and add
the block agreement to the counsel scope (4). **The cover note to counsel is the best
document in this kit** — the five questions are the right five, the honest paragraph about
what a liability cap does not buy is exactly what makes a lawyer take a small client
seriously, and the two drafting constraints at the end are correct. Do not let anyone edit
it into something more polite.

**02 — Insurance Gate and Trip File.** The best operational document here and the one that
justifies the price. Gate 1's failure-mode section is the single most valuable page in the
kit. Fix "CLEARED TO LAUNCH" (2), "I don't fly anybody" (2), the Gate 4/5 cross-reference
(23), the additional-insured downgrade (20), and "committed today" (18). Everything else
stands.

**03 — Capability One-Pager and Proposal.** The most-published artifact and the one carrying
the most defects: the pricing incoherence (1), "launch authorized" (2), the payment terms
(3), unsubstantiated rate bands (15), the broker-step ownership (16), "supplies a pilot's
labor" (17), and the worked-example arithmetic (19). Do not print it until all seven are
fixed. The structure is right — the worked example in particular is a genuinely good sales
device, because pricing transparency about an uncomfortable ratio builds more trust than
hiding it. It just has to be arithmetically true.

**04 — Call Scripts and Objections.** Best writing in the kit. Objections 1, 2, 4, 7, 11 and
13 are excellent and should not be touched — objection 1 in particular ("if you've got a
guy, call him") is worth more than any marketing copy here. Fix the claim-gets-paid promise
(6), the no-bench lie (7), "pre-dispatch" (10), the invented complexity pricing (12), and
the negotiable terms (3).

**05 — Email Sequences.** Mechanically sound; the deliverability and CAN-SPAM sections are
correct and the street-address blocker is properly flagged. The problems are the fabricated
statistics (8), the pre-closing buyer (9), and quoting light jet work with an empty bench
(5). One structural note: "$895 **flat**" appears in three emails while the fee scales by
day everywhere else. Change "flat" to "for days one and two" in all three.

**06 — Pilot Bench Recruiting.** Correct on substance and the most honest document about
what AMG does not have yet. §5.4 is the rule the rest of the kit needs to obey (5). Fix the
"insurance-approved pilot exists before the phone call" sentence (5) and the make-and-model
/ type imprecision (22). §7.3 on declining pilots gracefully is very good — small market,
long memories, and that section reflects it.

**07 — Mission SOP and Tracker.** Thorough. The decline path (Part 2) is excellent, and
"AMG is declining the schedule, not making the go/no-go call" is precisely the right
distinction. Fix the fee-before-gate sequencing (3), the piston discount instruction (11),
the three formulas (24), the missing gate columns (25), and the retention conflict (21). The
proof-note rules in Part 3.2 are better than most published guidance on the subject — the
"category + date + city pair is often enough to identify an aircraft" test is exactly right
and should be reused verbatim on the website.

**08 — First 90 Days.** The most useful strategic document here and the only one willing to
say a number is impossible. The ceiling analysis and the "five failure modes" section are
both strong, and failure mode 5 ("the one that ends the career rather than the company") is
the correct framing for the whole business. Fix the prepaid block (4), the piston price (11),
and the pre-counsel selling instruction (13).

**README and trackers.** Fix the dead link (27), the mail-merge columns (26), and the
inaccurate claim that all tracker columns come from document 07 (26).

---

# THE FOUR THINGS THAT BLOCK EVERYTHING

Restating from across the kit, because they are scattered and they are all binary:

1. **AMG's own liability and E&O bound**, with the four services described verbatim on the
   application (Fla. Stat. §627.409). Blocks the first flight. 08 says two to four weeks —
   start it today.
2. **A real deliverable street address published.** Blocks all cold email; the exposure is
   per-message.
3. **FDACS answer in writing on §501.604(3).** Blocks call volume. Note that 04's ground
   rules describe the exemption as "short call, then a face-to-face **or a written
   agreement** to finish the sale." The statute's exemption is a sale completed at a **later
   face-to-face meeting**. A signed PDF emailed back is not a face-to-face meeting, and
   writing it that way in an internal document is how the posture quietly stops applying.
   Fix that sentence to say face-to-face only, and put the ramp visit in the middle of the
   day for that reason — which 07 §5.1 already does correctly.
4. **Counsel's redline on 01, plus a block agreement if the block is being sold.**

Everything else in this review is correctable in an afternoon at a keyboard. These four are
not, and three of them have external clocks.
