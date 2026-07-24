# AMG Aviation Group — Outbound Email Sequences

Four audiences. Four touches each over about 12 business days. Sixteen emails total.

**Rules these were written to.** 50–125 words, under 80 preferred. Subject lines are two to four words, all lowercase, no punctuation. One ask per email — never two. Touch 1 carries the sequence; 58% of replies come from it, so it states the price and the structure in the body rather than gating them behind a call.

**Why the price is in the email.** The advice to never quote cold is written for enterprise software with a discovery call in front of it. This is a transaction-sized service with a published price. A Director of Maintenance's actual fear is an open-ended bill from a stranger. One sentence kills it: *$895 flat, the owner pays the pilot directly, no markup, no rebates.* Withholding the number reads as a setup for a markup.

**What none of these emails do.** No email offers lift, availability, an aircraft, or a delivered price for moving an airplane. No email uses the word "dispatch." No email says "we verify the pilot." No email promises 24/7, nationwide, or a network. Read the do-not-do list in the operating facts before editing a single line of copy.

---

## Merge fields

Every email is individually sendable via mail merge. Fields are written explicitly in the copy as `{{field}}`. Any row with a blank required field does not send — fix it or drop the row.

| Field | Used by | Required | Fallback |
|---|---|---|---|
| `{{first_name}}` | all | yes | none — do not send |
| `{{company}}` | all | yes | none — do not send |
| `{{city}}` | all | yes | none — do not send |
| `{{home_field}}` | shops, flight depts, dealers | yes | none — do not send |
| `{{type_common}}` | shops, dealers, flight depts | no | "your customers' airplanes" / "the fleet" |
| `{{agency_name}}` | brokers | yes | none — do not send |
| `{{tail}}` | flight depts | no | omit the sentence |
| `{{referral_source}}` | all | no | omit the sentence |

Rule: if a merge field appears inside a sentence that stops making sense when the fallback fires, cut the whole sentence in the fallback variant. Do not ship "your customers' airplanes owners."

**Every email below sends from `tony@{{cold_domain}}` — never from `information@amgaviationgroup.com`.** See Deliverability.

---

# SEQUENCE 1 — INDEPENDENT MAINTENANCE SHOPS

Target: owner, GM, Director of Maintenance. The shop is a referral source, never the customer. The pitch is throughput, not price. An airplane you can't get onto your ramp is a slot you can't bill.

### 1.1 — Day 1

**Subject:** `stuck airplane`

> {{first_name}} — Tony Gonzalez, AMG Aviation Group. Working corporate pilot, North Lauderdale.
>
> When a {{company}} customer has an airplane parked somewhere because nobody can bring it to {{home_field}}, I source the pilot. The owner contracts with me and pays the pilot direct. My invoice is one line: $495 piston, $895 turboprop, days one and two. No markup on anything, no rebates to anyone.
>
> Do you have one sitting right now?

*82 words. Ask: one question about a live airplane.*

### 1.2 — Day 4

**Subject:** `who signs 8130-6`

> {{first_name}} — one thing shops ask me about ferries out of annual.
>
> The special flight permit application under 21.199 goes in from the owner or the owner's A&P/IA. Never from me. The FSDO or DAR issues the 8130-7 and the operating limitations come with it. I want a copy of both in the file before the pilot launches, because 91.9(a) makes those limitations binding on him.
>
> If your IA already handles that, I'm the easy half. Want the checklist I use?

*84 words. Ask: send the checklist.*

### 1.3 — Day 8

**Subject:** `the slow part`

> {{first_name}} — the honest version of my timeline.
>
> Turbines usually need a written endorsement from the owner's underwriter naming that specific pilot. That runs 24 to 72 hours. So "someone there tomorrow morning" on a jet is often not real, and anyone telling you it is hasn't asked the broker yet.
>
> Which means the useful move is starting the insurance step when you book the slot, not when the airplane is due.
>
> How far out does {{company}} usually know?

*80 words. Ask: one question about scheduling lead time.*

### 1.4 — Day 12

**Subject:** `last one`

> {{first_name}} — I'll stop here.
>
> If a {{company}} customer ever needs a pilot to move an airplane, I'm at (954) 408-1730. Owner contracts with AMG, owner pays the pilot direct, one coordination fee, no markup. I don't provide airplanes and I don't take a fee for referring anyone to a Part 135 operator.
>
> Reply "later" and I'll check back in six months. Otherwise you won't hear from me again.

*72 words. Ask: one word, or nothing.*

---

# SEQUENCE 2 — FLORIDA AVIATION INSURANCE BROKERS

Target: producer or account executive on owner-flown and small-fleet Part 91 accounts. The broker is a referral source and a gatekeeper at the same time. Lead with the fact that AMG makes the broker's approval step easier, not with the fee.

### 2.1 — Day 1

**Subject:** `open pilot warranty`

> {{first_name}} — Tony Gonzalez, AMG Aviation Group, North Lauderdale. Working corporate pilot.
>
> I source contract pilots for Part 91 owners who need a seat filled. Before anyone launches I confirm certificates, currency and time-in-type, and I put that pilot's qualifications in front of the owner's broker for written approval. No email from you, no flight. On turbines I assume the open pilot warranty is unusable and ask for an endorsement.
>
> Would that packet arriving pre-built be useful to {{agency_name}}?

*79 words. Ask: one question.*

### 2.2 — Day 4

**Subject:** `what is in it`

> {{first_name}} — what I send your underwriter, unprompted:
>
> Commercial or ATP certificate, medical, ratings, type where applicable, last recurrent completion certificate. Total, multi, turbine, make-and-model and 90-day times. For a domestic Part 91 SIC, 61.55(b) currency inside twelve calendar months. W-9 and the pilot's own non-owned liability COI.
>
> I never use a private pilot for compensated flying, including mentor work. 61.113(a).
>
> Anything your carriers want that I've left out?

*72 words. Ask: what's missing.*

### 2.3 — Day 8

**Subject:** `ferry endorsement`

> {{first_name}} — the one that catches people.
>
> When the airplane moves on a special flight permit under 21.197, I want the broker's written acknowledgment of the ferry in the same email as the pilot approval. Not a separate conversation two weeks later when there's a claim.
>
> Also, my agreement asks the owner's carrier for a waiver of subrogation in favor of AMG on hull and liability. Standalone condition, not negotiable.
>
> Does that clear your desk without a fight?

*80 words. Ask: one question.*

### 2.4 — Day 12

**Subject:** `closing the file`

> {{first_name}} — last note from me.
>
> If an {{agency_name}} insured ever needs a pilot and doesn't have one, send them my way. I take no fee from you, ever, and no fee for pointing anyone at a Part 135 operator. The owner contracts with AMG directly and pays the pilot direct.
>
> (954) 408-1730. Reply "keep me posted" if you'd rather I check back later in the year.

*69 words. Ask: one word, or nothing.*

---

# SEQUENCE 3 — AIRCRAFT DEALERS AND BROKERS

Careful audience. When the dealer holds title, the dealer is the owner and can contract with AMG directly. When the dealer does not hold title, the seller or buyer contracts and the dealer is a referral source. Never quote one all-in delivered price for moving an airplane. Never imply AMG can supply an airplane.

### 3.1 — Day 1

**Subject:** `pre-buy ferry`

> {{first_name}} — Tony Gonzalez, AMG Aviation Group, North Lauderdale. Corporate pilot.
>
> When a {{company}} airplane needs to get to a pre-buy or out to a buyer, I source the pilot. If you hold title you contract with me directly; if you don't, the owner does. Either way the pilot is paid direct by whoever holds title and my invoice is one line — $895 turboprop and light jet, $495 piston, days one and two.
>
> How many moves does {{company}} do in a normal month?

*84 words. Ask: one question about volume.*

### 3.2 — Day 4

**Subject:** `not a delivered price`

> {{first_name}} — why I won't quote you a number to move an airplane.
>
> A single all-in delivered price is how a coordination job starts looking like transportation for compensation. So I price the coordination, the owner pays the pilot and the fuel and the hotel direct, and nothing runs through me. It's cleaner for your file too — the pilot's invoice is the pilot's invoice.
>
> Does your closing process handle a second vendor invoice easily?

*76 words. Ask: one question.*

### 3.3 — Day 8

**Subject:** `insurance on delivery`

> {{first_name}} — the piece that usually delays a delivery.
>
> A pilot who isn't inside the open pilot warranty needs a written endorsement naming him, and on a turbine that's 24 to 72 hours from the underwriter. If the buyer's binder starts at closing, the pilot has to clear the buyer's carrier, not the seller's. Worth knowing which one you're flying under before the day.
>
> Which side's policy do your deliveries usually move under?

*77 words. Ask: one question.*

### 3.4 — Day 12

**Subject:** `keep the number`

> {{first_name}} — I'll leave it here.
>
> (954) 408-1730 when {{company}} has an airplane that needs a pilot. I don't source airplanes and I don't broker charter, so I'm not competing with anything you do.
>
> Reply "later" and I'll follow up after the season.

*49 words. Ask: one word, or nothing. Short on purpose — it's a breakup, not a pitch.*

### Do not send to this audience

Anything that reads as availability of lift, any list of aircraft, any suggestion AMG can find a buyer an airplane. If a dealer asks whether AMG can get someone a plane, the answer is the scripted one in Reply Handling.

---

# SEQUENCE 4 — SMALL PART 91 FLIGHT DEPARTMENTS

Target: chief pilot or aviation manager at a one-to-three airplane department. They already know everything in the operating facts. Do not explain the industry to them. Sell coverage of a known gap.

### 4.1 — Day 1

**Subject:** `spare pilot`

> {{first_name}} — Tony Gonzalez, AMG Aviation Group. Corporate pilot out of {{city}}.
>
> One-and-two-pilot departments have the same hole: recurrent, a medical, a vacation, and the airplane sits. I source the contract pilot, run him through your carrier for written approval before he flies, and hand you the file. You pay him direct. My fee is separate and flat — $495 piston, $895 turboprop, days one and two.
>
> When is {{company}}'s next recurrent window?

*77 words. Ask: one date.*

### 4.2 — Day 4

**Subject:** `61.55 question`

> {{first_name}} — a quick one, since you'd know.
>
> For your domestic Part 91 SIC seat, are you holding contract right-seaters to 61.55(b) currency inside twelve calendar months, or asking for an SIC type rating? 61.55(a)(3) exempts domestic US operations, but about half the departments I talk to are still requiring the rating and paying for it.
>
> Curious where {{company}} lands on that.

*63 words. Ask: one opinion. This email builds credibility, not pipeline — expect replies with no deal attached and answer them anyway.*

### 4.3 — Day 8

**Subject:** `insurance required second`

> {{first_name}} — if your policy names a second-pilot or mentor requirement, one warning.
>
> That seat cannot be filled by a private pilot. 61.113(a) — compensated PIC. Mentor arrangements break on this more than anything else I see, usually with good intentions and a handshake.
>
> I only source commercial and ATP, and the endorsement email from your broker comes before the flight, not after.
>
> Does {{tail}} carry a named-pilot requirement right now?

*74 words. Ask: one question. Fallback if `{{tail}}` is blank: "Does your policy carry a named-pilot requirement right now?"*

### 4.4 — Day 12

**Subject:** `on file`

> {{first_name}} — last one.
>
> Put me in the file for the week you're short: (954) 408-1730. Owner contracts with AMG, pilot paid direct by you, one coordination fee, no markup and no rebates from anybody.
>
> If it's easier, reply with the month your recurrent falls and I'll reach out then instead of now.

*58 words. Ask: one month.*

---

# CAN-SPAM COMPLIANCE BLOCK

Every one of the sixteen emails carries this footer. No exceptions, including replies inside an active thread that still contain the original commercial pitch. 16 CFR Part 316.

### Required elements

1. **Accurate from, reply-to and routing headers.** The sending domain must resolve to AMG. No spoofed friendly-from.
2. **A subject line that does not misrepresent the message.** "stuck airplane" describes the offer; "RE: your invoice" would be a violation.
3. **Identification as an advertisement.** Satisfied by context here — the body plainly solicits business — but the footer states it anyway.
4. **A valid physical postal address.** Street address, city, state, ZIP. A PO box is acceptable only if registered to AMG with USPS. A private mailbox is acceptable if registered with a Commercial Mail Receiving Agency.
5. **A clear opt-out mechanism.** Reply-based unsubscribe is legal and is what AMG uses. No link farm, no preference center.
6. **Opt-outs honored within 10 business days** and honored forever. Never sold, never transferred, never "refreshed."

### The footer

```
AMG Aviation Group
{{SITE.streetAddress}}, North Lauderdale, FL {{SITE.postalCode}}
(954) 408-1730

You're getting this because you work in aviation maintenance, insurance,
sales or flight operations in Florida. Reply "stop" and I'll remove you
and never contact you again.
```

### BLOCKER — read before scheduling a send

> **`SITE.streetAddress` is currently a placeholder.** Until a real, deliverable postal address for AMG Aviation Group is in that field, **no cold email may be sent.** Every message goes out non-compliant, and the statutory exposure is per-email, not per-campaign.
>
> Resolve it one of three ways: the actual business street address; a USPS-registered PO box in the AMG name; or a CMRA mailbox registered to AMG. Registered agent addresses do not count unless mail actually reaches Tony there.
>
> Same address must appear on the website footer, the coordination agreement, and the invoice. Three different addresses across three documents is the thing an opposing lawyer enjoys finding.

### Also true, and not CAN-SPAM

- **No auto-dialer, no bulk SMS, no ringless voicemail.** Ever. Manual dial only.
- **Maintain a written DNC policy** under 47 CFR 64.1200(d) even though this is business-to-business. One page, dated, kept on file.
- **Florida is two-party consent for recording**, Fla. Stat. §934.03. If a call that starts from an email reply gets recorded, both sides consent on the recording first.
- **Florida Telemarketing Act, §§501.601–501.626.** The B2B exemption at §501.604(10) does not cover AMG — it requires three years operating under the same name. §501.604(3) is the one that plausibly fits: no major sales presentation by phone, sale completed at a later face-to-face meeting. **This must be confirmed with FDACS before the phone campaign runs.** It does not gate email, but the email sequences feed the phone, so settle it early.
- **No testimonials in any email** until a real customer gives written permission. FTC 16 CFR Part 465, penalties up to roughly $53,088 per violation. Incentivized testimonials must disclose the incentive.
- **No unsubstantiated claims** anywhere in these sequences: no guaranteed availability, no 24/7, no worldwide or nationwide, no network size, no mission counts, no years of experience that can't be documented.

---

# DELIVERABILITY RULES

### Separate domain, separate seat, non-negotiable

Register a second domain for cold outreach only. Roughly $12/year. Something adjacent and honest — `amgaviation.co`, `amg-aviation.net`, `flyamg.co`. Give it its own Google Workspace seat, about $7–14/month.

**Nothing cold ever leaves `information@amgaviationgroup.com`.** That address carries quotes, agreements, insurance packets and invoices. One spam complaint against it degrades the reputation of the domain that customers already trust with money. Sending cold from the primary domain risks the business to save $12.

Practical shape:
- Cold outreach: `tony@{{cold_domain}}`
- Everything after a positive reply: move the thread to `information@amgaviationgroup.com` with one line — "moving us to my main address."
- The cold domain redirects to `amgaviationgroup.com` and has a real one-page site. A domain with no site looks disposable to filters.

### Authentication before the first send

All three published and verified before message one:

- **SPF** — TXT record authorizing Google Workspace. One SPF record per domain, not two.
- **DKIM** — 2048-bit key generated in Workspace, published, then turned on. Publishing without enabling does nothing.
- **DMARC** — start at `p=none` with an `rua` reporting address, watch for two weeks, then move to `p=quarantine`.

Verify with a mail-tester tool and send a test to a Gmail account and an Outlook account before touching the list.

### Warm-up

**14 to 21 days before real outreach.** No shortcut, and warmup services that generate fake conversations are increasingly detectable.

| Days | Sends/day | Content |
|---|---|---|
| 1–3 | 2–5 | Real emails to Tony's own contacts, asking for a reply |
| 4–7 | 5–10 | Same, plus mailing-list signups that generate legitimate traffic |
| 8–14 | 10–20 | First real prospects, hand-picked, the warmest names on the list |
| 15–21 | 20–25 | Sequence goes live at normal cadence |

### Volume ceiling

- **Month one: 20–30 sends per day.** 25 is the working number.
- **Never above about 50/day**, month one or ever, at this list size.
- **New Google Workspace domains are capped at 500 recipients/day** regardless. That cap is not a target.
- Bounce rate above 3% — stop sending, clean the list, verify addresses.
- Spam complaint rate above 0.1% — stop the campaign, rewrite touch 1.

### List hygiene

Verify every address before it enters the sequence. Aviation lists rot fast; a DOM who left the shop in 2024 is a hard bounce and hard bounces are what actually kill a young domain.

---

# THE HONEST MATH

Do the arithmetic before building expectations on this channel.

```
500 contacts
÷ 25 sends per day
= 20 working days just to finish the first touch
```

Add the sequence itself. A contact emailed on day 20 gets touch 4 on day 32.

| Milestone | Business day | Calendar, from decision to buy the domain |
|---|---|---|
| Domain purchased, SPF/DKIM/DMARC published | 1 | day 1 |
| Warm-up complete | 15–21 | ~day 21–30 |
| First real sequence email sent | 22 | ~day 31 |
| First replies arrive (touch 1 pulls 58%) | 23–25 | ~day 33–36 |
| First qualifying call | ~27 | ~day 38 |
| First engagement signed and flown | ~30 | ~day 42 |
| First invoice paid, net 15 | ~40 | ~day 55 |

### Say it plainly

**Cold email cannot produce the 14-day number. It is a month-two channel and should be budgeted as one.**

Anyone who tells Tony a cold sequence generates revenue inside two weeks is either skipping warm-up — which burns the domain — or has never sent from a new domain.

**The 14-day number comes from the phone and the ramp.** Manually dialed calls to shops in the service area, and walking onto ramps with the printed one-pager. Those have no warm-up period, no authentication requirement, and no 500/day cap. Cold email's job is to keep the pipeline full in month three so month three doesn't depend on Tony driving to Fort Lauderdale Executive again.

Build the list and the domain in week one. Do not wait on them for revenue.

---

# REPLY HANDLING

Reply inside four business hours during the day. A DOM who emails back about a stuck airplane has already called somebody else.

Every reply moves to `information@amgaviationgroup.com` the moment it turns positive.

### "Not interested"

Remove immediately. Do not send touch 2. Do not attempt a "just curious what changed" email — it converts nothing and generates complaints.

> Understood. I'll take you off the list. If it ever comes up, (954) 408-1730.
>
> Tony

Log the removal with a date. Keep the suppression list forever.

### "Send me info"

Usually polite deferral, occasionally real. Answer it in one move — attach and stop. Do not ask a qualifying question here; it reads as a dodge.

> Attached — one page, everything's on it.
>
> Short version: you'd contract with me, you'd pay the pilot direct, and my invoice is one line. $895 turboprop and light jet for days one and two, $495 piston. No markup on anything and no rebates to anybody.
>
> If something's moving, call me — (954) 408-1730.
>
> Tony

Attach the capability one-pager PDF from `03-capability-one-pager-and-proposal.md`. Nothing else. Do not attach the agreement to a cold reply.

### "Who are you"

They're checking legitimacy. Answer in plain language and give them something checkable. Do not get defensive and do not oversell.

> Fair question. Tony Gonzalez — I fly corporate, based in North Lauderdale, and AMG is my company. amgaviationgroup.com, (954) 408-1730.
>
> I source contract pilots for Part 91 owners. I don't own airplanes, don't broker charter, and don't sell trips. The owner hires me, the owner pays the pilot direct, I invoice a coordination fee. That's the entire business.
>
> Happy to get on the phone.
>
> Tony

### "Can you get me a plane"

The scripted answer. Word for word, every time, from anyone.

> AMG doesn't provide aircraft. I can refer you to a Part 135 operator and I take no fee for that referral.

A fee for that referral makes AMG an air charter broker under 14 CFR Part 295. There is no version of this where a small thank-you is fine.

### A live request

Someone has an airplane that needs to move. Do not sell — schedule and start the gate.

> I can work with that. Two things before anything else:
>
> Who's the registered owner, and can you put me in touch? The owner contracts with me directly — not the shop, not a passenger, not a broker.
>
> Second, I'll need the owner's insurance broker's contact. Nobody launches without written confirmation from the underwriter naming the specific pilot. On a turbine assume 24 to 72 hours, so the sooner that starts the sooner the airplane moves.
>
> Call me when you have a minute — (954) 408-1730.
>
> Tony

Then run `02-insurance-gate-and-trip-file.md` from the top. No email, no flight. Nothing in a reply thread waives an item on that list.

### Referral fee requests

If a shop or a Director of Maintenance asks for a cut, it goes to the **shop entity**, against the shop's invoice, with a W-9 on file — never to an individual personally. Fla. Stat. §838.16 makes commercial bribery a third-degree felony, §838.15 covers the recipient, and employer consent is the line. If the person asking doesn't want their employer to know, that is the answer.

### Out of office / wrong person

Pause the sequence to the return date. If the auto-reply names a replacement, start that person at touch 1 as a fresh row — never mid-sequence.

### Nothing back after touch 4

Stop. Move the row to a six-month recheck list. Do not restart the same sequence on the same person in ninety days.

---

# PRE-SEND CHECKLIST

Do not send until every line is checked.

- [ ] `SITE.streetAddress` populated with a real deliverable address — **this is the blocker**
- [ ] Cold domain registered, redirecting, with a live one-page site
- [ ] Separate Workspace seat provisioned
- [ ] SPF, DKIM, DMARC published and verified
- [ ] 14–21 day warm-up complete
- [ ] List verified, bounces removed
- [ ] Suppression list created and empty-but-live
- [ ] Written DNC policy on file (47 CFR 64.1200(d))
- [ ] Every merge field populated on every row, or the row is dropped
- [ ] Capability one-pager PDF finalized and ready to attach
- [ ] Daily cap set to 25 in the sending tool
- [ ] FDACS §501.604(3) exemption question raised (blocks phone, not email — but raise it now)
