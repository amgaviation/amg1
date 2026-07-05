# Website Launch Checklist — Business-Plan Rebuild

Tracks the Website Build Specification §13 pre-launch gates against the
`rebuild/business-plan-site` branch. "Built" means the code path exists and is
wired; "OPEN" items need real-world input from Antonio before the site goes
public. **The site should not launch while any OPEN item remains.**

## Resolved in code

- [x] Placeholders resolved: Founder/Chief Pilot = Antonio Gonzalez · North Lauderdale, FL · +1 (954) 408-1730 · Southeast US (`lib/site-config.ts`)
- [x] Pricing table live with real Business Plan §6.2 figures in every cell; no toggles, no configurator (`/pricing`)
- [x] Worked example on Home and Pricing from one shared component with matching numbers (`components/site/worked-example.tsx`)
- [x] Day-rate ranges published with "updated quarterly" stamp (`DAY_RATES` in `lib/site-config.ts` — restamp each quarter)
- [x] /legal consolidates the operational-control statement; per-page disclaimer pattern removed from all public pages
- [x] Footer: city/state, phone, ops@, affiliation chip, one-line operational-control statement linking Legal
- [x] Old pages 301-redirected (`next.config.ts`): plans→pricing, capabilities/operations/services/aircraft→how-it-works, about→team, crew-network→pilots, booking-request/request-support/contact→request, faqs→pricing, amg-connect→connect→login
- [x] Quote form posts into `contact_form_submissions` (timestamped at intake — the SLA clock) and routes into portal missions; confirmation state names the 24-hour commitment
- [x] Analytics events wired: `quote_form_submit`, `pricing_request_click`, `pilots_apply_click`, `phone_tap` (fire into consent-gated GA — requires `NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- [x] SEO: unique title/description per page, LocalBusiness JSON-LD with address/phone, sitemap includes future case-study URLs
- [x] Missions surfaces are data-gated: nothing renders until real case studies exist in `content/missions/index.ts` (no placeholders can ship)

## OPEN — needs Antonio before launch

- [ ] **Three real case studies** in `content/missions/index.ts` (template documented in the file). Home proof section and /missions nav link appear automatically once entries exist. *(Business Plan §10 gate — five proof missions first.)*
- [ ] **Team page photo + credentials** — `TEAM_ROSTER` in `lib/site-config.ts` has `photo: null` and `credentials: null`. Add a real photo and the certificates/hours/types line (e.g. "ATP, CFII · 4,200 hrs · PC-12/TBM"). An anonymous or thin team page is disqualifying (Business Plan §10).
- [ ] **Street address** — `SITE.streetAddress` currently shows city/state only; publish the staffed business address.
- [ ] **ops@amgaviationgroup.com mailbox** — the site displays ops@ everywhere, but form notifications still deliver to `information@` (`lib/email/config.ts` → `contactEmail`). Create/route the ops@ mailbox, then update that constant and retire info@/information@ per spec §12.
- [ ] **AOPA membership** — footer/team show an "AOPA Member" chip (`AFFILIATIONS` in `lib/site-config.ts`). Confirm membership is active or remove until it is.
- [ ] **Counsel review of /legal** and the Owner Services / Contract Pilot Agreements (Business Plan §7.3). The page copy is a structural draft, not legal advice.
- [ ] **Analytics env** — set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel so the four events fire (they no-op without it), then verify events arrive before the day-90 review.
- [ ] **Quote form end-to-end test in production** — submit, confirm the row lands in `contact_form_submissions` with timestamp, the portal mission is created, and both emails deliver.
- [ ] **Mobile pass on real devices** — pricing table (stacked cards < md), worked example, and quote form.
- [ ] **Website-editor rework or retirement** — the portal super-admin website editor still edits the old CMS pages (`content/site/*.json`), which no longer drive the public site. Decide: retire it or repoint it at the new pages. (Guard `website-editor:verify` files kept intact meanwhile.)
- [ ] **ops@ auto-reply for inbound attachments** (Portal Spec §5) — configure the ops@ mailbox to auto-reply to messages carrying attachments, repeating that credentials upload only through the portal, never email.
- [ ] **Counsel confirmation of credential retention window** (Portal Spec §9) — the site publishes "active + 12 months" on /pilots and /legal; counsel must confirm or correct that figure, and the published statement changes the same week the configured policy does.

## Definition of done (spec)

A stranger with an SR22 can land on the homepage and, without contacting
anyone, learn who runs AMG, what a ferry will cost within ~15%, how fast
they'll hear back, and what happens if AMG misses its window.
