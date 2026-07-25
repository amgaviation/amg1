import localFont from "next/font/local";
import { PublicShell } from "@/components/site/public-shell";
import { SITE } from "@/lib/site-config";

/**
 * schema.org ProfessionalService (spec §12 SEO basics).
 *
 * ProfessionalService rather than the bare LocalBusiness: AMG has no premises a
 * customer visits, and the service-area shape is what actually matches.
 *
 * areaServed was "United States", which is the same unsubstantiated-reach claim
 * we removed from the ticker — AMG works Florida and the Southeast, and a
 * nationwide claim in structured data is still a claim. Named states instead.
 *
 * The service list mirrors what /pricing sells. Keep the two in step: this is
 * the machine-readable version of the same promise, and a mismatch between them
 * is the kind of thing that gets read back to you.
 */
const PROFESSIONAL_SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE.name,
  url: SITE.url,
  telephone: SITE.phone,
  email: SITE.email,
  founder: { "@type": "Person", name: SITE.founder },
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.streetLine,
    addressLocality: "North Lauderdale",
    addressRegion: "FL",
    postalCode: SITE.postalCode,
    addressCountry: "US",
  },
  areaServed: ["Florida", "Georgia", "Alabama", "South Carolina", "North Carolina", "Tennessee"],
  knowsAbout: [
    "Part 91 aircraft operations support",
    "Contract pilot sourcing",
    "Maintenance ferry coordination",
    "Aircraft repositioning",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Aircraft support coordination",
    itemListElement: [
      "Temporary contract pilot coverage",
      "Maintenance ferry and repositioning coordination",
      "Insurance, mentor, or second-pilot coordination",
      "Flight-department overflow coordination",
    ].map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  },
  description:
    "Aviation operations support coordination for owner-controlled Part 91 aircraft: contract crew sourcing, maintenance ferry and repositioning coordination, documentation, and closeout administration. AMG is not an air carrier and does not operate aircraft; owners retain operational control.",
};

// AMG Brand & Voice Guide 2026 type system (authoritative over the older
// Space Grotesk in production): Barlow Condensed = display, Inter =
// body/interface + operational data, JetBrains Mono = eyebrows/data. All
// self-hosted (no runtime request to Google Fonts — CSP-safe).
const display = localFont({
  src: [
    { path: "../fonts/barlow-condensed/barlow-condensed-latin-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/barlow-condensed/barlow-condensed-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/barlow-condensed/barlow-condensed-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/barlow-condensed/barlow-condensed-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/barlow-condensed/barlow-condensed-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/barlow-condensed/barlow-condensed-latin-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-barlow",
  display: "swap",
});

const body = localFont({
  src: "../fonts/inter/inter-latin-wght.woff2",
  weight: "400 700",
  variable: "--font-inter-web",
  display: "swap",
});

const mono = localFont({
  src: "../fonts/jetbrains-mono/jetbrains-mono-latin-wght.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} contents`}
      style={
        {
          // Brand type system applied across the whole public subtree,
          // overriding the root <body>'s Inter-only defaults. Display =
          // Barlow Condensed, body/interface = Inter, data/eyebrows =
          // JetBrains Mono.
          "--font-display":
            'var(--font-barlow), "Barlow Condensed", "Arial Narrow", "Nimbus Sans Narrow", sans-serif',
          "--font-sans":
            'var(--font-inter-web), Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
          "--font-mono":
            'var(--font-jetbrains-mono), ui-monospace, "SF Mono", monospace',
        } as React.CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PROFESSIONAL_SERVICE_SCHEMA) }}
      />
      <PublicShell>{children}</PublicShell>
    </div>
  );
}
