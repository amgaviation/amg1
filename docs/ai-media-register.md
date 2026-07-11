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
