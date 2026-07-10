"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { runWithMotion } from "./motion";
import Globe from "./svg/globe";
import { CookiePreferencesButton } from "@/components/compliance/cookie-consent";
import { PUBLIC_LEGAL_FOOTER_LINKS } from "@/lib/navigation";
import { AFFILIATIONS, OPERATIONAL_CONTROL_STATEMENT, SITE } from "@/lib/site-config";
import { prefersReducedMotion } from "./reveal";

const SUPPORT_CHECKPOINTS = [
  "Scope review",
  "Crew sourcing",
  "Insurance gate",
  "Documentation",
  "Status tracking",
  "Closeout file",
];
const CHECKPOINT_H = 44; // px row height for the vertical ticker

/**
 * GLOBAL + FOOTER — pinned 140vh dark sequence:
 *  p 0.00–0.50 : "Approved support -> [checkpoint]" stepped vertical ticker,
 *                giant GLOBAL watermark parallaxes up
 *  p 0.10–0.55 : support-route arcs line-draw across the globe
 *  p 0.60–0.85 : globe dims and settles; footer contact + legal block
 *                fades up onto clear ground and rests fully opaque
 */
export default function GlobalFooter() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    return runWithMotion(
      ({ gsap }) => {
        const ctx = gsap.context(() => {
          const steps = SUPPORT_CHECKPOINTS.length - 1;

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
              pin: ".global-stage",
            },
          });

          tl.to(".city-rail", { y: -CHECKPOINT_H * steps, ease: `steps(${steps})`, duration: 0.5 }, 0)
            .fromTo(".global-word", { yPercent: 24 }, { yPercent: -8, duration: 1 }, 0)
            .fromTo(
              ".globe-wrap",
              { yPercent: 16, scale: 0.94 },
              { yPercent: 0, scale: 1, duration: 0.6 },
              0
            )
            .to(".flight-arc", { strokeDashoffset: 0, stagger: 0.06, duration: 0.45 }, 0.1)
            .to(".ticker-row", { opacity: 0, duration: 0.1 }, 0.52)
            // The globe yields to the footer — dims and eases down so the
            // contact links land on clear ground.
            .to(
              ".globe-wrap",
              { opacity: 0.3, yPercent: 6, duration: 0.22, ease: "power1.out" },
              0.6
            )
            // Footer fade completes well before the pin releases, so the copy
            // always rests at full opacity (fade rule).
            .fromTo(
              ".footer-block",
              { opacity: 0, y: 48 },
              { opacity: 1, y: 0, duration: 0.22, ease: "power1.out" },
              0.62
            )
            // The persistent CTA pill yields to the footer's own links.
            // Element reference: the pill lives outside this gsap.context scope.
            .to(
              document.querySelector<HTMLElement>(".fd-pill") ?? [],
              { opacity: 0, pointerEvents: "none", duration: 0.08 },
              0.82
            );
        }, root);
        return () => ctx.revert();
      },
      () => {
        // Motion chunk failed — the contact/legal block starts CSS-hidden
        // ([data-fd-hidden]); force it visible rather than lose the footer.
        const block = root.current?.querySelector<HTMLElement>(".footer-block");
        if (block) block.style.opacity = "1";
      }
    );
  }, []);

  return (
    <section ref={root} id="global" className="fd-pin-section relative h-[140vh] bg-canvas">
      <div className="global-stage radar-grid relative h-screen w-full overflow-hidden">
        {/* giant watermark */}
        <div className="global-word pointer-events-none absolute inset-x-0 top-[8vh] text-center will-change-transform">
          <span
            className="font-display font-medium leading-none text-transparent"
            style={{
              fontSize: "clamp(6rem, 22vw, 24rem)",
              WebkitTextStroke: "1px rgba(91,157,255,0.4)",
            }}
          >
            Global
          </span>
        </div>

        {/* globe */}
        <div className="globe-wrap absolute left-1/2 top-[38vh] w-[90vh] max-w-[92vw] -translate-x-1/2 will-change-transform">
          <Globe className="w-full opacity-90" />
        </div>

        {/* support-anywhere ticker — backed by a scrim so it reads clear of
            the watermark letterforms */}
        <div className="ticker-row absolute left-1/2 top-[24vh] flex w-max max-w-[92vw] -translate-x-1/2 items-center gap-3 border border-grid-silver bg-canvas/85 px-4 py-2.5 backdrop-blur-sm md:gap-6 md:px-5">
          <span className="text-base text-t1 md:text-lg">Approved support</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 text-instrument"
            aria-hidden="true"
          >
            <path d="M2 12h14M12 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <div className="relative h-[44px] overflow-hidden">
            <div className="city-rail will-change-transform">
              {SUPPORT_CHECKPOINTS.map((checkpoint) => (
                <div key={checkpoint} className="flex h-[44px] items-center font-display text-xl text-t1 md:text-2xl">
                  {checkpoint}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-canvas to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-canvas to-transparent" />
          </div>
        </div>

        {/* footer block — canvas scrim rises over the globe's lower limb so
            the contact links sit on clear ground */}
        <div
          className="footer-block absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas/90 to-transparent pt-16"
          data-fd-hidden
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 md:grid-cols-3 md:px-10">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-short.png"
                alt="AMG Aviation Group"
                width="1110"
                height="242"
                loading="lazy"
                decoding="async"
                className="mb-4 h-7 w-auto"
              />
              <p className="text-2xl leading-snug text-t1">
                Your aircraft, supported
                <br />
                <span className="text-t3">with total clarity and control</span>
              </p>
            </div>
            <div className="font-mono text-sm text-t1">
              <a
                href={`mailto:${SITE.email}`}
                className="fd-navlink block w-fit transition-colors hover:text-instrument"
              >
                {SITE.email}
              </a>
              <a
                href={SITE.phoneHref}
                className="fd-navlink mt-3 block w-fit transition-colors hover:text-instrument"
              >
                {SITE.phone}
              </a>
              <Link
                href="/request"
                prefetch={false}
                className="fd-navlink mt-3 block w-fit transition-colors hover:text-instrument"
              >
                Request Support
              </Link>
              <Link
                href="/login"
                prefetch={false}
                className="fd-navlink mt-3 block w-fit text-t2 transition-colors hover:text-instrument"
              >
                Portal login
              </Link>
            </div>
            <div className="md:text-right">
              <p className="microlabel text-t2">{SITE.cityState}</p>
              <p className="microlabel-green mt-2">
                {AFFILIATIONS.join(" // ").toUpperCase()} // SERVING{" "}
                {SITE.region.replace("the ", "").toUpperCase()}
              </p>
              <p className="mt-4 text-[11px] leading-relaxed text-t2">
                {OPERATIONAL_CONTROL_STATEMENT} Details in{" "}
                <Link href="/legal" prefetch={false} className="underline underline-offset-2 hover:text-t1">
                  Legal
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-grid-silver px-6 py-3 md:justify-between md:px-10">
            <span className="microlabel text-t2">
              © {new Date().getFullYear()} {SITE.name}
            </span>
            <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {PUBLIC_LEGAL_FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className="microlabel text-t2 transition-colors hover:text-t1"
                >
                  {link.label}
                </Link>
              ))}
              <CookiePreferencesButton className="microlabel text-t2 transition-colors hover:text-t1" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
