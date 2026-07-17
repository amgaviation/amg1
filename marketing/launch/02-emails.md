# AMG Aviation Group — Launch Email Sequence

Four sends across the launch window. Sender: **AMG Aviation Group** ·
`information@amgaviationgroup.com`. Keep formatting plain and premium — one clear
CTA per email. Banner image for the launch send: `images/41-email-banner.png`.
Append the campaign UTM to every link: `?utm_source=email&utm_medium=email&utm_campaign=launch_2026&utm_content={slug}`.

> Guardrails (same as the rest of the campaign): AMG *coordinates*, it does not operate
> the aircraft; the owner/operator keeps operating authority and final acceptance; no
> absolute guarantees; pricing figures match the site's worked example.

---

## Email 1 — Launch-eve tease
**Send:** Mon Jul 27, ~5:00pm ET · **Audience:** waitlist + existing contacts
**Subject A:** It goes live tomorrow.
**Subject B:** Tomorrow, 8:00 AM.
**Preview text:** Owner-controlled aviation support — crew, movement, maintenance, coordinated.
**utm_content:** `email_tease`

**Body:**

> Tomorrow morning, AMG Aviation Group goes live.
>
> For owners and flight departments, it's a simpler way to handle the work around your aircraft — crew coverage, ferry and repositioning, maintenance flights — coordinated by people who do this for a living, while you keep operating authority and final say.
>
> No markup. A flat coordination fee. One portal for everything.
>
> We'll send the details at **8:00 AM ET tomorrow.** If you've been waiting to get an aircraft moved, positioned, or crewed — hold that thought until you read it.
>
> — The AMG Aviation Group team

*(No button. This one just sets the hook.)*

---

## Email 2 — Launch-day announcement
**Send:** Tue Jul 28, 7:30am ET · **Audience:** full list
**Subject A:** AMG Aviation Group is live.
**Subject B:** Private aircraft support, coordinated.
**Preview text:** Crew, movement, and maintenance — handled, while you keep control. $295 flat, zero markup.
**Banner:** `images/41-email-banner.png`
**utm_content:** `email_launch`

**Body:**

> **AMG Aviation Group is live.**
>
> Running a private aircraft means a hundred moving parts — a crew gap on Thursday, a ferry to a maintenance facility, a repositioning before the next trip, and the paperwork behind all of it. Handling it shouldn't mean handing over control.
>
> **AMG coordinates the people, planning, and operational support around your aircraft — while you keep operating authority and final acceptance.**
>
> What we coordinate:
>
> - **Contract pilot support** — coverage matched to your aircraft, role, and mission, reviewed before assignment.
> - **Ferry & repositioning** — movement handled, responsibilities kept clearly defined.
> - **Maintenance flight support** — positioning to and from facilities, with the requirement, status, and next action in view.
> - **AMG Connect** — one role-based portal for requests, documents, quotes, and status.
>
> And the part owners tell us they've been waiting for:
>
> > **$295 flat coordination fee. Every pass-through cost billed at cost — receipts included.**
> > No markup on your pilot, your fuel, or your per diem. Most requests quoted within ~12 hours.
>
> US-based. Worldwide coordination. Reviewed for operational fit before anything is accepted.
>
> **[ Start a support request → ]** (`/request-support`)
>
> Prefer to talk first? Reply to this email or reach us at `/contact`.
>
> — The AMG Aviation Group team

---

## Email 3 — How AMG works (nurture)
**Send:** Tue Aug 4, 7:30am ET · **Audience:** full list (or openers of Email 2)
**Subject A:** From request to coordinated, in three steps.
**Subject B:** How an AMG request actually works.
**Preview text:** Tell us the aircraft, route, and timing. We review for fit. We coordinate. Most quoted in ~12 hours.
**utm_content:** `email_howitworks`

**Body:**

> A week in, the most common question we're getting is a good one: *what actually happens when I send a request?* Here's the whole thing.
>
> **1. Request.** Tell us the aircraft, the route, and the timing. A few lines is enough to start.
>
> **2. Reviewed for fit.** We review aircraft status, documents, and owner/operator approval, and confirm the request is something we can coordinate well. Coverage indicators aren't a promise of instant placement — we review before we commit.
>
> **3. Coordinated.** Crew, movement, and maintenance handled, with the requirement and next action kept visible in **AMG Connect** the whole way. Most requests are quoted within ~12 hours — pass-through costs at cost, plus the flat $295 coordination fee.
>
> Through all of it, you keep operating authority and final acceptance. AMG coordinates around you, not over you.
>
> **[ See how it works → ]** (`/how-it-works`)  ·  **[ Start a request → ]** (`/request-support`)
>
> — The AMG Aviation Group team

---

## Email 4 — Two-weeks-in recap + CTA
**Send:** Tue Aug 11, 7:30am ET · **Audience:** full list (suppress anyone who already submitted a request)
**Subject A:** The whole thing, in five lines.
**Subject B:** Ready when you are.
**Preview text:** Owner-controlled coordination. $295 flat, zero markup. One portal for everything.
**utm_content:** `email_recap`

**Body:**

> Two weeks ago, AMG Aviation Group went live. If you've been meaning to take a closer look, here's the entire idea in five lines:
>
> - We coordinate **crew, movement, and maintenance flights** around your aircraft.
> - **You keep operating authority and final acceptance.**
> - **$295 flat** coordination fee — pass-through costs at cost, receipts included.
> - Crew **matched to your aircraft and reviewed before assignment.**
> - **One portal — AMG Connect —** for requests, documents, quotes, and status.
>
> If any of that would make your next month easier, the first step is one short request.
>
> **[ Start a support request → ]** (`/request-support`)
>
> Questions first? Just reply — a person reads every one.
>
> — The AMG Aviation Group team

---

### Sending notes
- **From name / reply-to:** AMG Aviation Group / `information@amgaviationgroup.com` (monitor replies — Emails 3 & 4 invite them).
- **List hygiene:** suppress completed requesters from Email 4; consider a crew-only variant of Email 2 pointing to `/pilots` if you segment pilots.
- **Deliverability:** authenticate the sending domain (SPF/DKIM/DMARC) before the launch send; warm up if the list has been dormant.
- **One CTA rule:** every email drives a single primary action. Don't add competing buttons.
