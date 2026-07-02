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
  - Higgsfield GPT Image 2 for the corrected 16:9 Collins Pro Line-style FMS/CDU cockpit frame and fallback poster.
  - Local FFmpeg motion pass for the shipped 5-second MP4/WebM, using the corrected GPT Image 2 frame as the source, with a slow cockpit push-in and subtle avionics scan sweep.
  - Local production derivative for the transparent AMG Connect logo asset using the provided AMG Connect logo reference and the existing AMG wordmark.
- Date generated: July 2, 2026.
- Intended page or component: authenticated AMG Connect portal shell via `components/portal/PortalIntro.tsx`.
- Production brief: premium, minimal, dark corporate aviation cockpit/FMS-style opening anchored on a Collins Pro Line-style business aviation FMS/CDU, with AMG CONNECT highlighted as an active fix, then resolved into a clean dark portal loading state.
- Depicted aircraft class or operational scenario: generic private/corporate jet cockpit with physical FMS/CDU line-select keys, alphanumeric keypad, PFD/MFD avionics in the background, yoke, and throttle quadrant; no tail number, airport identifier, airline branding, or specific aircraft registration.
- Reviewer: AMG Aviation Group / product owner.
- Approval status: pending final brand review in portal context.
- Notes: No sound by default. Earlier free-form Higgsfield video renders were rejected because they drifted toward automotive/infotainment styling. The shipped motion asset intentionally uses a controlled source frame to preserve credible cockpit avionics/FMS hardware and avoid car-screen drift.
