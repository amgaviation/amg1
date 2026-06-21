# AMG Public Redesign Content Parity Map

Date: 2026-06-21

## Content Sources Used

- `lib/content.ts`
- `lib/navigation.ts`
- `content/site/*.json`
- `lib/website-editor/content.ts`
- `lib/compliance/legal-pages.ts`
- Current public route tree under `app/(public)`
- Existing AMG generated and custom assets under `public/images`

## Homepage Parity

| Existing public content | New location | Wording | Layout change | Functionality change | Omission reason |
|---|---|---|---|---|---|
| Cockpit-to-sky homepage entrance | Top of `/` via `CockpitEntrance` | Preserved approved hero wording | Retained sticky native-scroll entrance | No handler change | None |
| AMG company proposition | `/` after entrance via `CompanyPositioning`; `/about` remains | Consolidated from approved content and `COMPANY.tagline` | New asymmetric editorial section | No backend change | None |
| Crew coverage | `/` services, `/` crew globe, `/crew-network` | Preserved approved review wording | Services row and crew-region visual | No data behavior change | None |
| Aircraft movement | `/` services and `/capabilities` | Preserved support coordination wording | Editorial numbered row | No backend change | None |
| Maintenance repositioning | `/` services and `/aircraft-support` | Preserved baseline language | Editorial numbered row | No backend change | None |
| Recurring owner/fleet support | `/` support options and `/plans` | Preserved plan-review and pricing restraint | Sticky split support model section | No purchasing behavior added | None |
| Request process | `/` process section and `/capabilities` | Consolidated to four required steps | Route-line process treatment | No submission behavior change | None |
| Audiences | `/` accessible audience tabs | Preserved owner/department/operator/crew descriptions | Replaced static cards with keyboard buttons and active panel | No backend change | None |
| Why AMG proof points | `/` four editorial columns | Preserved four proof points | Wake-grid visual treatment | No fake metrics/testimonials | None |
| Aircraft support context | `/` aircraft context and `/aircraft-support` | Preserved aircraft-class caveats | Dark visual gallery | No guarantee implied | None |
| AMG Connect | `/` Connect preview and `/amg-connect` | Preserved role-based portal wording | Portal screenshot frame preserved | Auth not recreated | None |
| Final support CTA | `/` `CtaBand` | Preserved acceptance disclaimer | Blue-hour sky CTA | No backend change | None |
| Footer legal and company links | `SiteFooter` | Preserved footer descriptor and disclaimer | Existing footer retained | Cookie preferences retained | None |

## Detail Page Parity

| Route | Existing content retained | New visual system participation | Notes |
|---|---|---|---|
| `/about` | Company overview, principles, team/support structure | Public layout, shared hero, footer | No history or metric claims added |
| `/capabilities` | Support paths, operating model, limitations | Public layout, shared hero | Services redirects preserved |
| `/aircraft-support` | Aircraft categories, support context, disclaimers | Public layout, shared hero, aircraft gallery | No guaranteed aircraft coverage claim |
| `/crew-network` | Credential review language, region caveat | Public layout, globe fallback, CTA | No sensitive crew locations |
| `/plans` | Plan model, comparison matrix, operational notes | Public layout, plan builder | No purchase/subscription activation |
| `/amg-connect` | Role views and portal screenshot explanation | Public layout, portal preview | No fake dashboard or auth logic |
| `/contact` | Contact routing, dedicated support request path | Public layout, existing form | Field contract unchanged |
| `/request-support` | Intake, support details, acknowledgments | Public layout, existing form | Server-action contract unchanged |
| Legal pages | Approved legal text | Public shell and footer | Legal language unchanged |
| Auth/access pages | Login, setup, reset, access status | Existing public shell | Auth behavior unchanged |

## Copy Rules Applied

- Kept “support request” and “request review” language instead of charter-booking language.
- Preserved the “requests are reviewed before acceptance” constraint across hero, process, forms, and final CTA.
- Did not add fake counts, customer names, testimonials, response times, geographic guarantees, or availability guarantees.
- Avoided unsupported luxury phrases such as “book a flight,” “charter now,” “reserve a jet,” and “guaranteed availability.”

## Stop Slop Pass

Checked active homepage copy against the Stop Slop phrase and structure references. Removed generic SaaS-style framing where the homepage previously leaned on card grids, and kept copy concrete around aircraft status, crew qualifications, owner/operator approval, route and airport constraints, weather, timing, and support scope.
