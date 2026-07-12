# AI Media Register

Status: working register.

Generated or edited AI media must be tracked with prompt, model or vendor when known, generation date when known, intended usage, reviewer, and approval status.

## Known Location

`public/images/amg-generated` contains generated AMG media and manifests where available.

## Required Fields For New Generated Assets

- File path
- Source tool or model
- Prompt or production brief
- Date generated or received
- Intended page or component
- Any depicted aircraft class or operational scenario
- Reviewer
- Approval status
- Notes about trademarks, tail numbers, people, airport identifiers, or sensitive operational details

## Registered Assets

### `public/images/cabin/cabin-b.webp`

- **File path:** `public/images/cabin/cabin-b.webp` (re-encoded from a 1376×768 source PNG to a ~128 KB WebP; alignment constants are fractional so re-encoding is safe).
- **Source tool or model:** Higgsfield (AI-generated night private-jet cabin plate), supplied in the design handoff bundle.
- **Prompt or production brief:** Photoreal night cabin sidewall (quilted dark leather, oval porthole, walnut rail, ceiling curve) for the home hero "porthole fly-through" intro. Painted window center (0.500, 0.5026), size 0.1628W × 0.3802H — the live window frame is composited over it.
- **Date received:** 2026-07-11.
- **Intended page or component:** Public home — `components/flightdeck/hero.tsx` (cabin backdrop).
- **Depicted aircraft class or scenario:** Generic business-jet cabin interior at night; no exterior aircraft, no operating status implied.
- **Reviewer:** Automated build; pending human sign-off on the draft PR.
- **Approval status:** Pending review (draft PR).
- **Notes:** Interior scene only — no tail numbers, registrations, people, manufacturer marks, or airport identifiers rendered. The porthole shows the existing approved `stratosphere.webp` sky.

### `public/images/flightdeck/jet-side.webp`

- **File path:** `public/images/flightdeck/jet-side.webp` (transparent RGBA, ~29 KB WebP; re-encoded from a 1334×351 source PNG).
- **Source tool or model:** Higgsfield (AI-generated), supplied in the design handoff bundle. Distinct from `jet-topdown-cutout.webp`.
- **Prompt or production brief:** Photoreal side-profile business jet on transparent background, nose right, for the hero "skywriter" beat (a distant jet that crosses the porthole pane and appears to write the AMG wordmark from its contrail).
- **Date received:** 2026-07-11.
- **Intended page or component:** Public home — `components/flightdeck/hero.tsx` (skywriter jet).
- **Depicted aircraft class or scenario:** Generic business jet in a decorative "distant flyby" role, rendered small (14% of the pane width); not used to represent a specific aircraft category or operating status.
- **Reviewer:** Automated build; pending human sign-off on the draft PR.
- **Approval status:** Pending review (draft PR).
- **Notes:** No tail number, registration, or manufacturer mark rendered. Paired with text labels elsewhere for any operational meaning, per the brand guide's iconography rule.

### `public/images/flightdeck/jet-topdown-cutout.webp`

- **File path:** `public/images/flightdeck/jet-topdown-cutout.webp`
- **Source tool or model:** Higgsfield `image_background_remover` (background removal only — no generative synthesis).
- **Prompt or production brief:** None. Isolated the subject from the existing, already-approved `public/images/flightdeck/jet-topdown.webp` to produce a true-transparency (RGBA) cutout for the home "Jet Flyover" section, replacing a `mix-blend-mode: multiply` compositing hack.
- **Date received:** 2026-07-11.
- **Intended page or component:** Public home — `components/flightdeck/jet-flyover.tsx`.
- **Depicted aircraft class or scenario:** Top-down business jet silhouette over a plain light field; illustrative "enroute maintenance ferry" scenario. Geometry is unchanged from the source asset (background removal preserves the original aircraft shape).
- **Reviewer:** Automated build; pending human sign-off on the draft PR.
- **Approval status:** Pending review (draft PR).
- **Notes:** No tail numbers, people, registrations, or manufacturer marks are rendered on the aircraft. Airport identifiers (KTPA/KATL) and the sample tail "N412AG" appear only as adjacent typographic labels, not on the airframe. Because this is a derivative of an existing approved asset (not a new generation), aircraft geometry accuracy is inherited from the source.
