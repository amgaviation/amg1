# AMG Aviation Group Reference

This is the durable Codex reference for AMG Aviation Group work. It is derived from three
user-provided PDFs shared on July 4, 2026:

- AMG Aviation Group - Business Plan.pdf
- AMG Aviation Group - Website Build Specification.pdf
- AMG Connect - Portal Configuration Specification.pdf

Use this file before making product, website, portal, pricing, operations, compliance, copy,
or launch recommendations for AMG Aviation Group. The original PDFs were local files in
Tony's Downloads folder; this repo note exists so future work is not dependent on local
machine paths.

## Challenge Rule

If a future prompt conflicts with this reference, do not silently implement the conflict.
Challenge it, cite the relevant section below, and propose the closest compliant alternative.
If Tony intentionally changes direction, update this reference in the same workstream so the
new decision becomes durable.

Examples that require a challenge:

- Hiding pricing behind "contact us" except for Fleet Agreements.
- Shipping placeholders for founder, chief pilot, address, phone, region, proof missions, or
  case studies.
- Reintroducing the Plan Builder/configurator, "desks" team abstraction, or scattered
  per-page disclaimers.
- Using `info@` as the primary public operations email instead of `ops@`.
- Claiming AMG supplies aircraft, operates aircraft, guarantees aircraft availability, guarantees
  lowest price, or controls go/no-go decisions.
- Combining aircraft sourcing with crew sourcing.
- Asking pilots to email credentials instead of using secure portal upload.
- Building custom portal software before launch volume justifies it.
- Shipping a public launch without a named team page and three real case studies.
- Removing the 24/12/4 business-hour quote response commitments or the automatic
  remedy structure without a documented pricing/legal update.

## Business Model

AMG Aviation Group is a crew-sourcing and flight-coordination company for Part 91 aircraft
owners, small flight departments, MROs, brokers, and service centers in the United States.
The core work is sourcing qualified contract pilots, verifying credentials and insurability,
producing itemized mission quotes, handling agreements and logistics, tracking missions in
AMG Connect, and closing each mission with documents, invoices, and receipts.

AMG is not an air carrier, does not provide aircraft, does not sell flight time, does not bundle
aircraft with crew, and does not take operational control. Owners retain operational control at
all times. AMG earns flat published coordination fees plus recurring retainer revenue for
priority service levels.

Core mission types:

- Maintenance ferries and repositioning.
- Contract PIC/SIC coverage for Part 91 operations.
- Insurance-required second pilot or mentor pilot placements.
- Pre-buy and delivery-flight crewing.
- Recurring reposition programs for MROs and brokers.

Out of scope by policy:

- Any arrangement supplying aircraft and crew together.
- Any passenger or property transportation offer that would constitute air transportation.
- International or oceanic ferries until a later phase; refer those to specialists.

## Target Segments

- Owner-flown piston and turboprop owners, such as SR22, Bonanza, PC-12, and TBM owners.
- Small flight departments with one or two aircraft and limited crew bench depth.
- MROs, brokers, and service centers that need repeat aircraft movement support.

The launch geography is one region only, with Florida/Southeast as the working assumption.
SLA expansion follows verified pilot bench depth, never ambition.

## Pricing

AMG's margin must live entirely in flat coordination fees and retainers. Pilot day rate, travel,
lodging, per diem, and other mission costs pass through at cost with receipts and zero markup.

Aircraft bands:

- Band A: piston.
- Band B: turboprop and light jet.

Published network day-rate ranges, updated quarterly:

- Piston: $500-$800/day.
- Turboprop and light jet: $1,000-$1,600/day.

Launch pricing table:

| Item | On-Demand | Standard | Priority |
| --- | ---: | ---: | ---: |
| Monthly fee, Band A | $0 | $149 | $349 |
| Monthly fee, Band B | $0 | $299 | $649 |
| Coordination fee/mission, Band A | $495 | $295 | $195 |
| Coordination fee/mission, Band B | $895 | $595 | $395 |
| Quote response commitment | 24 business hours | 12 business hours | 4 business hours |
| Crew-option sourcing window | Best effort | 48 hours or month's fee credited | 24 hours plus first-call priority or month's fee credited |
| Portal, records, and currency tracking | Per-mission | Full account | Full account plus dedicated coordinator and extended-hours line |
| Annual option | None | Pay 10 months, get 12 | Pay 10 months, get 12 |

Fleet Agreements are the only quote-priced offering. They are for multi-aircraft or
high-frequency needs and may include volume pricing, dedicated coordinator coverage, tailored
SLAs, and monthly invoicing.

Required worked example for Home and Pricing:

- SR22 maintenance ferry, Tampa to Atlanta, Standard member.
- Contract pilot, 1 day: $600.
- Airline return: about $240.
- Per diem: $75.
- AMG coordination: $295.
- Approximate total: $1,210 all-in, quoted within 12 business hours.

Terms hygiene:

- Monthly plans cancel anytime, effective end of period.
- Annual plans refund unused whole months minus one.
- AMG may decline missions for insurance, safety, aircraft condition, or legality.
- Missed committed response/sourcing windows trigger automatic plan-fee credits.

## Website Rules

Voice must be direct, numerate, and commitment-forward. Every section should tell the reader
what happens, by when, and for how much. Required vocabulary includes hours, dollars, names,
and dates.

Banned vocabulary:

- "operational assessment"
- "structured review"
- "coordination cadence"
- "elevated"
- "solutions" as a noun
- tier adjectives such as "highest" or "premium-level"

Numbers are the brand. The 24-hour quote commitment, worked mission example, day-rate
ranges, and plan prices must appear where buyers need them, not behind forms.

People must be visible. The founder name appears on the homepage. The team page must
show real names, real photos, certificates held, hours/types where relevant, backgrounds, and
roles. The "desks" concept is deleted, not redesigned.

Use one operational-control statement in the footer, linking to Legal, and in the Legal page and
agreements. Remove scattered disclaimer blocks across pages.

Required sitemap:

- `/` Home
- `/pricing` Plans and Pricing
- `/how-it-works` Process with timestamps
- `/missions` Case studies
- `/team` Real humans
- `/pilots` Pilot network recruiting and credential handling
- `/for-shops` MRO and broker partnerships
- `/request` Quote request form
- `/legal` Terms summary, operational-control statement, privacy and data handling
- `/connect` Portal login

Deleted or redirected pages:

- Plan Builder/configurator.
- Desks or team-structure abstraction page.
- Standalone capabilities/process-limitations page; merge useful content into
  `/how-it-works` and `/legal`.

Global footer requirements:

- Street address, phone, `ops@amgaviationgroup.com`, AOPA member badge, portal login.
- One-line statement: AMG is a crew-sourcing and coordination service, is not an air carrier,
  does not operate aircraft, and aircraft owners retain operational control.

## Page Requirements

Home:

- Hero promise: reliable crew and aircraft movement for Part 91 owners.
- Include 24-business-hour quote commitment, founder name, region, and phone above the fold.
- Show the worked example as a styled trust block.
- Route Aircraft Owners to Pricing, Flight Departments and Shops to For Shops, and Pilots to
  Pilots.
- Show services strip: crew coverage, maintenance ferries, repositioning, insurance-required
  second pilots.
- Show three real mission proof cards only when real case studies exist.
- Show commitments: 24-hour quote response, 7-day pilot payment, $0 pass-through markup.

Pricing:

- Show every AMG price on the page. No table cell may say "contact us" except the Fleet
  Agreement line below the table.
- Present Band A/B as clearly labeled row groups, not a toggle.
- Include current day-rate ranges, the worked example, plan positioning, and no more than six
  FAQ items.
- Primary CTA: Request a Quote.

How It Works:

- Steps: Submit in about 5 minutes; Quote within 24/12/4 business hours; Crew confirmed
  target 48 hours or 24 for Priority; Fly tracked in AMG Connect.
- Include "What we never do": never supply aircraft, never take operational control, never mark
  up pass-through costs.
- Include an insurance-gate explainer: no mission proceeds until selected pilot is named or
  approved on the owner's policy.

Missions:

- Launch requires three real case studies.
- Each case study includes route, aircraft, mission type, owner problem, real timeline,
  itemized cost breakdown, pilot qualification line, owner/reference line, and verification line.
- Newest first. One new case study per month after launch.

Team:

- Mandatory launch roster: founder plus named senior aviation credential, such as chief pilot
  advisor or fractional senior credential.
- Include honest scale statement: AMG is a small, senior team by design.
- Include affiliations, address, and phone.

Pilots:

- Lead with 7-day payment after mission completion.
- Publish vetting standard: certificates, medicals, type experience, insurance history,
  references.
- State credentials upload only through the secure portal, never email.
- Access to raw credential records is limited to named AMG roles.

For Shops:

- Audience is MROs, brokers, and one-to-two aircraft flight departments.
- Offer Fleet Agreements with volume pricing, dedicated coordinator, tailored SLAs, and
  monthly invoicing.
- Explain why this is quote-priced: fleet needs vary and AMG will show the math.

Request:

- The single conversion endpoint.
- Fields: name, email, phone, aircraft type, tail number, mission type, dates,
  origin/destination, insurance carrier, free-text notes.
- Confirmation repeats the quote commitment and says a named coordinator will reply.
- Backend timestamps submissions because SLA tracking starts at intake.

Legal:

- One counsel-drafted page replacing scattered disclaimers.
- Include what AMG is and is not, plan terms, privacy and pilot-credential handling, and links to
  full Owner Services Agreement and Contract Pilot Agreement PDFs.

## Website Technical Requirements

- Static or lightly dynamic site.
- Pricing table as HTML, not an image.
- Green Core Web Vitals on mobile.
- Unique titles and descriptions per page.
- Schema.org LocalBusiness with address and phone.
- Case studies as individual indexed URLs.
- Track quote form submit, pricing-to-request click-through, pilots apply click, and phone tap.
- Use `ops@` for operations/form notifications; kill `info@`.
- `/connect` routes to the configured portal. Single sign-on can wait.

Pre-launch checklist:

- Resolve all placeholders: founder, chief pilot, address, phone, region.
- Team page live with photos, certificates, and consented bios.
- Pricing table live with real figures.
- Worked example live on Home and Pricing.
- Day-rate ranges published with an updated-quarterly date.
- Three case studies live on `/missions`.
- `/legal` live with counsel-approved text.
- Per-page disclaimers removed sitewide.
- Old pages redirected to nearest equivalents.
- Quote form tested end to end and timestamping into metrics.
- Mobile pass on pricing table, worked example, and form.
- Analytics events firing and `ops@` receiving.

Definition of done for the public site: a stranger with an SR22 can land on the homepage and,
without contacting anyone, learn who runs AMG, what a ferry will cost within about 15%, how
fast they will hear back, and what happens if AMG misses its window.

## Portal Rules

Guiding rule: buy and configure, do not build custom portal software at launch. At a few
missions per month, a configured off-the-shelf stack beats months of custom development.
Custom software is justified by volume, not ambition.

The launch portal ships exactly five functions:

- Request intake and mission status.
- Document vault.
- Quotes and invoices.
- Message thread per mission.
- Reminder engine.

Explicitly deferred:

- Client self-serve plan changes.
- Pilot self-serve scheduling or marketplace features.
- Automated pilot matching.
- Payments inside the portal beyond hosted invoice links.
- Mobile apps.
- SSO.

Stack selection criteria:

- Client-facing portal with per-client login, file sharing, message threads, and form intake.
- Custom pipeline/status stages.
- Conditional forms and file uploads.
- Date-field automations and reminders.
- E-signature native or clean integration.
- CSV exports for metrics.
- Cost ceiling around $150-$250/month all-in at launch.

Accounting remains the system of record for invoices and receipts. The portal surfaces hosted
invoice links and documents. Every dollar must exist in exactly one system of record.

## Portal Forms

Client mission request:

- Name, email, phone, aircraft type, tail number, mission type, preferred dates,
  origin/destination, insurance carrier and broker contact, plan status, notes.
- Timestamp on submit; SLA clock starts here.
- Auto-acknowledgment repeats applicable response window and coordinator name.
- Entry starts at workflow state 1.

New-client onboarding:

- Owner/entity details, billing method, aircraft profile, insurance policy summary upload, and
  Owner Services Agreement e-signature.

Pilot application:

- Contact, certificates and ratings, medical class/expiry, hours, insurance history, references,
  certificate/medical uploads, credential-handling and background-verification consents.
- Creates vetting state "Applied" with a dated vetting checklist.

## Portal Workflow States

Every state change is timestamped.

1. Received; SLA clock running.
2. Feasibility and insurance screen; decline path logs insurance, safety, aircraft condition, or
   legality.
3. Quote sent; quote-SLA clock stops.
4. Pilot options presented; sourcing-window clock stops; present at least two options whenever
   bench allows.
5. Client accepted / pilot selected; on-demand payment collected here.
6. Papered; agreement signed and insurance approval confirmed.
7. Scheduled; logistics booked.
8. In progress; status notes to client thread.
9. Flown / closeout; agreement, invoice, receipts, and debrief note assembled.
10. Closed; pilot payout task auto-created with due date of closeout plus 7 days, drawn
    against the Pilot Float account.

Insurance confirmation is a hard gate: state 7 is locked until the insurance confirmation
document is attached. Weather scrub path goes from states 7-8 back to 7 with a scrubbed tag
and no coordination fee re-charged.

## Portal Document Vault

Per client:

- Aircraft file.
- Executed Owner Services Agreement.
- Insurance summary.
- Per-mission folders for quote, agreement, insurance confirmation, invoice, receipts, closeout.

Per pilot:

- Credential documents.
- Dated vetting checklist.
- Executed Contract Pilot Agreement.
- Per-mission debrief notes.

Access rules:

- Clients see only their own records plus assigned pilot qualification summaries.
- Clients do not see raw pilot credential documents.
- Pilots see their own file and assigned missions.
- Full access is limited to named AMG roles. At launch, Antonio Gonzalez is named.
- Credential uploads happen only through the portal, never email.

## Quote, Invoice, Metrics, And Reminders

Quote format:

- Client, tail number, mission, plan tier.
- Pilot option table with qualification summary, day rate, and days.
- Pass-through estimates itemized.
- AMG coordination fee per published schedule.
- All-in estimate and validity window.
- Standing line: AMG's fee is flat and every other line passes through at cost with receipts
  attached at closeout.

Invoice format:

- Mirrors quote line-for-line with actuals, receipts attached, and variance noted per line.

Metrics sheet, fed weekly from portal exports:

- Quote turnaround vs. SLA.
- Quote-to-booking conversion; day-90 thresholds are over 40% healthy and under 15% triggers
  pricing/pivot review.
- On-demand-to-retainer conversion within 90 days.
- Retainer churn.
- Pilot fill rate inside sourcing window, by band and geography.

Reminder engine:

- Client insurance renewal T-30.
- Assigned-pilot medical/currency expiry T-60/T-30.
- Plan renewal/annual billing T-14.
- Pilot payout warning closeout plus 5 and due closeout plus 7.
- Quarterly day-rate range review.
- Quarterly Priority-client review call.
- Annual counsel practices review.

## Security And Data Handling

- Unique logins.
- MFA on admin account.
- TLS-only access.
- Role-based access rules.
- Pilot records retained while active plus a counsel-defined number of months.
- Deletion-on-request honored through a logged task.
- Quarterly export/backup of the vault to encrypted storage.
- Published credential-handling statement must match actual configuration. If config changes,
  update the statement the same week.

## Legal And Compliance

Counsel review is a launch prerequisite. The Business Plan explicitly says the legal and
regulatory structure is not legal advice and must be reviewed by qualified aviation counsel
before AMG takes revenue.

Pre-revenue legal work:

- Aviation attorney drafts Owner Services Agreement, Contract Pilot Agreement, and Fleet
  Agreement templates.
- Counsel confirms the agency/contracting model.
- Counsel reviews website and marketing copy against holding-out risk.
- Counsel advises on state-level employment/staffing requirements if relevant.
- Budget: $8k-$15k.

Insurance work:

- Aviation-specialist broker binds general liability, professional liability/E&O, and non-owned
  aircraft liability as appropriate to a coordination agent.
- Broker defines standard pilot-insurability checklist.
- Budget: $8k-$12k/year initially.

Operating boundaries:

- No aircraft, ever.
- Owner retains operational control in writing.
- Present multiple pilot options and let the client choose whenever bench allows.
- Use one clean contracting path consistently after counsel confirms it.
- No holding out of transportation.
- Insurance is a hard gate.
- AMG fees are coordination/admin fees only; no per-passenger, per-mile, or
  transportation-styled pricing.

## Launch Gates And Financial Targets

Proof-of-work gate:

- Complete five real missions at cost before public launch.
- Each mission produces a tested workflow, a reference, and a case study.
- Publish three case studies at launch.
- If five free-coordination missions cannot be filled, trigger the pivot review before further
  spend.

Launch supply gate:

- 25 verified pilots weighted toward Band A.
- Each pilot has a dated vetting file and insurability screen.
- Three launch-region shop relationships targeted before public launch.

Launch capital:

- $60k-$90k total.
- Dedicated pilot-payment float: $15k-$25k, enough to float about three to five missions.
- Largest components: legal setup, insurance, tooling, marketing, float, and six-month
  operating buffer.

Year-one financial target:

- Ramp to about 30 retainer accounts and 12-15 missions/month by month 12.
- Estimated first-year revenue: $70k-$80k.

Year-two and year-three directional targets:

- Year 2: about 45 average retainers, about 25 missions/month average, first Fleet Agreement,
  $240k-$260k revenue.
- Year 3: about 70 retainers, about 45 missions/month, two Fleet Agreements, $440k-$480k
  revenue.

Break-even:

- Launch fixed costs: about $4k-$5k/month excluding founder pay.
- Operating break-even: about 25 retainer accounts plus 10-12 missions/month.
- Target timing: months 14-18.

Hiring trigger:

- One trained coordinator handles about 25-30 missions/month at target workflow maturity,
  assuming about 3-4 hours per mission.
- First coordinator hire is planned for mid-year two if volume permits.

## Operating Posture

Safety influence is structural, not operational control:

- Verified credentials.
- Insurance gates.
- Realistic duty expectations in scheduling.
- No-pressure culture on go/no-go, owned by the owner and PIC.
- Post-mission debrief field on every closeout to build pilot performance history.

Marketing posture:

- Anti-opaque option.
- Published prices, published day-rate ranges, zero pass-through markup, named people, SLAs
  with automatic remedies.
- Every marketing artifact should lead with a number a buyer can verify.

Primary channels:

- Type clubs and owner communities.
- MRO and shop partnerships.
- Insurance brokers and CFIs.
- Content/search around maintenance ferry cost, insurance approval, operational control, and
  contract pilot coordination.
- Pilot-side recruiting through payment within 7 days and low-friction administration.

## Open Items From Source Docs

Do not ship public-facing work until these are resolved where applicable:

- Founder name and credential line.
- Chief pilot or senior aviation credential.
- City/state address and phone.
- Launch region.
- Pilot credential retention period after inactive status, set by counsel.
- Counsel-approved legal text and agreements.
- Real proof mission data and case study permissions.
