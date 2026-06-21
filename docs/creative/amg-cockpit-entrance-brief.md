# AMG Cockpit Entrance Creative Brief

Date: 2026-06-21

## Source Direction

The provided Jesko Jets references were used only for macro interaction direction: a centered aircraft-window focal point, large split typography, a white centered brand mark, and a scroll-driven transition from interior frame to open sky.

The cockpit references were used only as structural aviation cues: centered rear flight-deck viewpoint, dark graphite panels, cool avionics glow, pilot seats framing the lower image, and a forward sky aperture. No supplied image is used directly in production.

## Selected Concept

Selected direction: **Operational cockpit aperture**

This direction makes the homepage open from an original large-cabin cockpit into a high-altitude cloud field. It keeps the experience cinematic without turning AMG into a charter/lifestyle brand. The cockpit reinforces coordination, aircraft support, and operational seriousness; the open sky provides the premium entrance moment and a clean field for the official AMG logo.

Rejected directions:

- **Pure passenger window macro**: closer to the Jesko Jets reference, but too similar in composition and less specific to AMG's operating-support positioning.
- **Hangar-to-cockpit hybrid**: preserved more of the old entrance, but retained the blocking hangar-door idea the task asked to replace.
- **Abstract cloud-only reveal**: cleaner and faster, but not distinctive enough for the requested cockpit-to-sky entrance.

## Copy Direction

Selected hero copy:

- H1: "Private aircraft support, coordinated."
- Support title: "Crew. Movement. Maintenance."
- Body: "AMG coordinates crew coverage, aircraft movement, maintenance repositioning, and recurring support for owners and flight departments."
- CTA: "Start a Support Request"
- Cue: "Scroll to enter AMG"
- Microcopy: "Requests are reviewed before acceptance."

Alternatives considered:

1. "Aircraft support, ready for review." Clear, but weaker and less complete than the selected H1.
2. "Keep the aircraft moving." Too close to an outcome guarantee and less compliant with the review-first support model.
3. "Support for the people behind the aircraft." Human and accurate, but less direct for search and service clarity.

The selected copy avoids charter sales language, guaranteed availability, operational-control claims, and promises that imply automatic acceptance.

## Interaction Requirements

The entrance is implemented as a native scroll section with a sticky viewport frame. It does not block the page, store session state, lock body scrolling, intercept wheel events, or hijack the user's scroll. A skip control jumps to the next homepage section, and reduced-motion users receive a static one-viewport composition with video disabled.

The centered logo uses the repository's official `/images/logo-white.png` asset. It is not generated, boxed, or placed inside a badge.
