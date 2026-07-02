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

## AMG Connect Portal Intro

- File paths:
  - `public/video/amg-connect-intro.mp4`
  - `public/video/amg-connect-intro.webm`
  - `public/video/amg-connect-intro-poster.jpg`
  - `public/brand/amg-connect-logo-white.png`
  - `public/brand/amg-connect-logo-white.svg`
- Source tool or model:
  - Higgsfield Cinematic Studio Video 3.5 for the 5-second intro MP4.
  - Higgsfield GPT Image 2 for the 16:9 fallback poster.
  - Local production derivative for the transparent AMG Connect logo asset using the provided AMG Connect logo reference and the existing AMG wordmark.
- Date generated: July 2, 2026.
- Intended page or component: authenticated AMG Connect portal shell via `components/portal/PortalIntro.tsx`.
- Production brief: premium, minimal, dark corporate aviation cockpit/FMS-style opening with AMG Connect integrated into avionics, then resolved into a clean dark portal loading state.
- Depicted aircraft class or operational scenario: generic private/corporate jet cockpit display; no tail number, airport identifier, airline branding, or specific aircraft registration.
- Reviewer: AMG Aviation Group / product owner.
- Approval status: pending final brand review in portal context.
- Notes: No sound by default. Generated video text is visually de-emphasized by a crossfade to the cleaned AMG Connect logo asset to protect brand fidelity.
