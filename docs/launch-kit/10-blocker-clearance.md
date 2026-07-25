# 10 — Blocker Clearance

Four things gate launch. None of them can be done by an agent, a script, or anyone
but Tony, because each needs either a signature, a licensed professional, or a fact
only he possesses. Everything that *could* be prepared for them is prepared below.

Run `npm run launch:ready` at any point to see which are still open. It reads the
repo, not a checklist, so it cannot be satisfied by ticking a box.

---

## 1. Bind aviation insurance

**Why it gates everything.** A shop treats a vendor with a certificate of insurance
as a vendor and a vendor without one as a stranger. More importantly, Fla. Stat.
§627.409 lets a carrier rescind for a material misrepresentation in the application
— **including an innocent one**. A policy rescinded after a loss is personal
exposure on an aviation claim.

**What to ask for.** General liability, non-owned aircraft liability, and aviation
professional liability / E&O. Ask the broker what limits shops in South Florida
typically require on a COI before they will onboard a vendor.

**The service description to put on the application, verbatim.** Do not paraphrase
it, do not shorten it, and do not let a broker "simplify" it. If what you told the
underwriter and what you actually do ever diverge, §627.409 is the clause that
matters.

> AMG Aviation Group provides coordination and administrative support for
> owner-controlled Part 91 aircraft operations. Four services:
>
> 1. Temporary and contract pilot sourcing support — identifying qualified
>    independent contract pilots for an aircraft owner who requires temporary crew
>    (callout, vacation, medical, recurrent training).
> 2. Maintenance ferry and repositioning coordination — coordinating crew, timing,
>    and documentation for the movement of an owner's aircraft to or from a
>    maintenance facility.
> 3. Second-pilot, mentor-pilot, and insurance-requirement coordination — sourcing
>    crew who meet a written requirement imposed by the owner's insurer.
> 4. Short-term flight-department overflow coordination.
>
> AMG does not own, lease, provide, operate, or dispatch aircraft. AMG holds no
> certificate under 14 CFR Part 119, 135, or 295. AMG never holds operational
> control as defined in 14 CFR 1.1. The aircraft owner and the pilot in command
> retain all operational authority. The aircraft owner contracts with AMG directly
> and pays the pilot directly; AMG does not handle trip funds, does not mark up
> third-party costs, and accepts no vendor rebates. AMG maintains a roster of
> independent contract pilots for sourcing purposes; pilots are engaged and paid by
> the aircraft owner, not by AMG.

**Ask the underwriter these three questions and write the answers down:**

1. Does the roster in the last sentence change how you rate this risk? (It is the
   sentence most likely to be read as crew furnishing.)
2. Is E&O available at all for a one-person non-operator coordination entity? If
   no carrier will write it, the liability cap and the waiver of subrogation in
   document 01 stop being negotiable terms and become the only protection there is
   — which changes how the agreement is negotiated.
3. What is your realistic turnaround to add a named pilot by endorsement on a
   turbine policy? Replace the 24–72 hour assumption in document 02 with the real
   number.

**Two Florida brokers already verified** (document 09 has more):
Sunset Aviation Insurance, 4095 Southern Blvd, West Palm Beach FL 33406,
561-210-0244 · Aviation Assurance, 16895 SW 59th Court, Fort Lauderdale FL 33331,
954-434-6222.

---

## 2. Get document 01 in front of a Florida aviation attorney

The cover note is already written and scoped — three documents, a budget, a
turnaround, and five specific questions. Send this and attach `01`:

> Subject: Aviation coordination agreement — limited review, 3 documents
>
> I'm a Florida-based corporate pilot starting a Part 91 coordination business —
> contract pilot sourcing and maintenance ferry coordination for aircraft owners.
> No aircraft, no certificate, no operational control.
>
> I've drafted the coordination agreement myself and I'd like a limited engagement:
> review and correct it, draft a short independent-contractor pilot referral terms
> document, and quote me separately for a prepaid credit agreement. The scope, the
> budget, the turnaround, and the five questions I most want answered are all in the
> cover note at the bottom of the attached document.
>
> I have a first customer waiting, so I'd rather have a fast answer on a narrow
> scope than a slow one on a broad scope.
>
> Antonio Gonzalez, AMG Aviation Group, (954) 408-1730

**Do not wait for the redline before selling.** Document 01's header now carries
four conditions under which the draft may be sent and signed while counsel works.
Meet all four or don't send it.

---

## 3. Founder credentials and photo

The single highest-value unfilled field on the site. A Director of Maintenance
checking AMG out before returning your call currently finds a name and a paragraph.

Edit `lib/site-config.ts` → `TEAM_ROSTER`:

```ts
credentials: "ATP · CFII · ~4,200 hrs · PC-12 / TBM 940 · recurrent Mar 2026",
photo: "/images/team/antonio-gonzalez.webp",
```

That string is a **format example, not your data.** Replace every value with what
is true and current. It renders next to a link inviting anyone to verify it against
the FAA Airman Registry — which is the entire point, and which is also why an
inflated number here is worse than no number at all.

Photo: on a ramp or a flight deck, landscape or 4:5, into `public/images/team/`.
A stock portrait is worse than none.

---

## 4. Publish a real street address

`SITE.streetAddress` is a placeholder. CAN-SPAM requires a valid physical postal
address in every commercial email, so **cold outreach is blocked until this is
real** — and it must match the website, the agreement, and the invoice.

A USPS-registered PO box or a CMRA mailbox is acceptable and is what most one-person
companies use. A home address is legal and is what many owner-operators do. What is
not acceptable is a placeholder or an address you do not control.

Also needed for the Google Business Profile in document 08's Week 0.

---

## What the repo enforces

`npm run launch:ready` fails while any of these is open:

| Check | Passes when |
|---|---|
| `TEAM_ROSTER.credentials` | not null |
| `TEAM_ROSTER.photo` | not null, and the file exists |
| `SITE.streetAddress` | differs from `SITE.cityState` and contains a street number |
| `AFFILIATIONS` | verified — remove the entry or mark it confirmed in code |
| Insurance + counsel | recorded in `docs/launch-kit/CLEARANCE.md` with a date |

The first four are read from code, so they cannot be faked by editing a checklist.
The last is an honour-system line — but writing a date next to "policy bound" that
is not true is the same act as putting it on the insurance application, and carries
the same consequence.
