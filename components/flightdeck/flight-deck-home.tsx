"use client";

import { useEffect, useRef } from "react";
import SmoothScroll from "./smooth-scroll";
import RequestPill from "./request-pill";
import { ScrollProgress, prefersReducedMotion } from "./fd-anim";
import Hero from "./hero";
import Ticker from "./ticker";
import Capabilities from "./capabilities";
import JetFlyover from "./jet-flyover";
import PricingManifest from "./pricing-manifest";
import StatsBand from "./stats-band";
import CtaBand from "./cta-band";
import GlobalFooter from "./global-footer";

/**
 * The Flight Deck home — the editorial, cinematic public marketing page
 * (design handoff recreation):
 *
 *   jet-window porthole intro → coordinate ticker → capabilities index →
 *   scroll-scrubbed jet flyover → pricing manifest → stats band →
 *   monumental CTA → void footer.
 *
 * `.fd-anim` is added to the root on mount only when motion is allowed, so
 * the reveal choreography exists only for JS-enabled, non-reduced-motion
 * visitors; SSR / no-JS / reduced-motion always render fully-visible copy.
 */
export default function FlightDeckHome() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!prefersReducedMotion()) root.current?.classList.add("fd-anim");
  }, []);

  return (
    <div ref={root} className="fd-site">
      <SmoothScroll />
      <ScrollProgress />
      <RequestPill />
      <Hero />
      <Ticker />
      <Capabilities />
      <JetFlyover />
      <PricingManifest />
      <StatsBand />
      <CtaBand />
      <GlobalFooter />
    </div>
  );
}
