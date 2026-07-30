import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { BRAND, TAGLINE } from "@/lib/studio/brand";
import "./studio.css";
import "./studio-parts.css";

/**
 * Type system for the studio, deliberately different from AMG's (Barlow
 * Condensed / Inter / JetBrains Mono).
 *
 * Only two faces are downloaded, and the split is a performance decision as much
 * as a design one. Loading three variable fonts put 114 kB across three
 * high-priority preloads on the critical path, and Lighthouse measured the LCP
 * element as the hero subhead — body text. So:
 *
 *   - Space Grotesk (22 kB, preloaded) carries the display voice. It is the
 *     identity; it earns the request.
 *   - JetBrains Mono carries every label, stat and tail number — the instrument
 *     -panel character — but `preload: false` keeps it off the critical path. It
 *     only ever sets 10–13px text, where a swap is imperceptible.
 *   - Body and interface text uses the platform UI stack (SF Pro / Roboto /
 *     Segoe). Zero bytes, paints on the first frame, and at this size it is
 *     indistinguishable from the Inter it replaced.
 *
 * Both faces are self-hosted, so nothing here touches a font CDN and the app's
 * enforced `font-src 'self' data:` CSP stays intact.
 */
const display = localFont({
  src: "../fonts/space-grotesk/space-grotesk-latin-wght.woff2",
  weight: "300 700",
  variable: "--studio-display",
  display: "swap",
});

const mono = localFont({
  src: "../fonts/jetbrains-mono/jetbrains-mono-latin-wght.woff2",
  weight: "100 800",
  variable: "--studio-mono",
  display: "swap",
  // Must stay `true`. next/font emits a *different* asset for a non-preloaded
  // instance, and app/(public)/layout.tsx already registers this same file with
  // preload on — so `preload: false` here made the browser fetch JetBrains Mono
  // twice (41 kB preloaded + 41 kB again on first use). Matching the existing
  // instance keeps it to one download.
  preload: true,
});

const DESCRIPTION = `${BRAND.name} builds websites, booking systems, client portals, and Stripe billing for flight schools, FBOs, MROs, and aviation service businesses. Fixed-scope quotes in two business days.`;

export const metadata: Metadata = {
  // `absolute` is required, not stylistic: the root layout defines a
  // "%s | AMG Aviation Group" title template, and this route must carry no AMG
  // reference in its own name.
  title: {
    absolute: `${BRAND.name} — Websites and software for aviation businesses`,
  },
  description: DESCRIPTION,
  applicationName: BRAND.name,
  // Also an override, not decoration: the root layout sets `authors` to AMG,
  // and metadata merges per-field rather than per-route.
  authors: [{ name: BRAND.name }],
  alternates: { canonical: BRAND.url },
  keywords: [
    "aviation web design",
    "flight school website",
    "FBO website",
    "aircraft scheduling software",
    "flight school booking system",
    "aviation client portal",
    "Stripe billing aviation",
  ],
  openGraph: {
    title: `${BRAND.name} — ${TAGLINE}`,
    description: DESCRIPTION,
    type: "website",
    siteName: BRAND.name,
    url: BRAND.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${TAGLINE}`,
    description: DESCRIPTION,
  },
  /**
   * Noindex while the studio lives on a path of the AMG deployment. Two brands
   * indexed under one domain confuses both, and the brief forbids the studio
   * being associated with the AMG domain. REMOVE this block the moment the site
   * is served from its own domain (see docs/3-green-studios.md).
   */
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/studio/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#05070A",
  width: "device-width",
  initialScale: 1,
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${display.variable} ${mono.variable} contents`}
      style={
        {
          // Mapped onto studio-local names so nothing here can be confused with
          // the AMG tokens of the same purpose defined in globals.css.
          "--s-font-display": `var(--studio-display), "Space Grotesk", ui-sans-serif, system-ui, sans-serif`,
          "--s-font-sans": `-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
          "--s-font-mono": `var(--studio-mono), ui-monospace, "SF Mono", Menlo, monospace`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
