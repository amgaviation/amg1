"use client";

import Link from "next/link";
import { Reveal } from "./fd-anim";
import { CookiePreferencesButton } from "@/components/compliance/cookie-consent";
import { PUBLIC_LEGAL_FOOTER_LINKS, PUBLIC_NAV_LINKS } from "@/lib/navigation";
import { OPERATIONAL_CONTROL_STATEMENT, SITE } from "@/lib/site-config";

/**
 * FOOTER — void footer closing the Flight Deck home. White short mark +
 * operational-control statement on the left; two mono link columns and a
 * contact block on the right; a hairline legal row underneath.
 *
 * (Replaces the earlier pinned globe/ticker sequence — the design closes on
 * the monumental CTA band instead.)
 */

export default function GlobalFooter() {
  const navLinks = PUBLIC_NAV_LINKS;
  const mid = Math.ceil(navLinks.length / 2);
  const colA = navLinks.slice(0, mid);
  const colB = navLinks.slice(mid);

  return (
    <footer
      id="global"
      style={{
        background: "var(--sp-void)",
        borderTop: "1px solid var(--sp-hair)",
        padding: "52px clamp(20px,4vw,52px) 36px",
      }}
    >
      <Reveal style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          className="rv fd-footer-top"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 32,
          }}
        >
          <div style={{ maxWidth: 440 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-short.png"
              alt="AMG Aviation Group"
              width="1110"
              height="242"
              loading="lazy"
              decoding="async"
              style={{ height: 26, width: "auto", display: "block" }}
            />
            <p
              style={{
                fontSize: 12.5,
                lineHeight: 1.7,
                color: "var(--sp-ink-3)",
                marginTop: 16,
              }}
            >
              {OPERATIONAL_CONTROL_STATEMENT}
            </p>
          </div>

          <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {colA.map((link) => (
                <Link key={link.href} href={link.href} prefetch={false} className="fd-foot-link">
                  {link.label}
                </Link>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {colB.map((link) => (
                <Link key={link.href} href={link.href} prefetch={false} className="fd-foot-link">
                  {link.label}
                </Link>
              ))}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                color: "var(--sp-ink-2)",
                lineHeight: 2.1,
              }}
            >
              {SITE.cityState}
              <br />
              <a href={SITE.phoneHref} style={{ color: "var(--sp-ink-2)", textDecoration: "none" }}>
                {SITE.phone}
              </a>
              <br />
              <a href={`mailto:${SITE.email}`} style={{ color: "var(--sp-ink-2)", textDecoration: "none" }}>
                {SITE.email}
              </a>
            </div>
          </div>
        </div>

        <div
          className="rv"
          style={{
            "--d": "0.15s",
            marginTop: 44,
            paddingTop: 20,
            borderTop: "1px solid var(--sp-hair)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.14em",
              color: "var(--sp-ink-3)",
            }}
          >
            © {new Date().getFullYear()} {SITE.name.toUpperCase()}
          </span>
          <span style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
            {PUBLIC_LEGAL_FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} prefetch={false} className="fd-foot-legal">
                {link.label}
              </Link>
            ))}
            <CookiePreferencesButton className="fd-foot-legal" />
          </span>
        </div>
      </Reveal>
    </footer>
  );
}
