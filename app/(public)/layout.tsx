import localFont from "next/font/local";
import { PublicShell } from "@/components/site/public-shell";
import { SITE } from "@/lib/site-config";

/** schema.org LocalBusiness with address/phone (spec §12 SEO basics). */
const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE.name,
  url: SITE.url,
  telephone: SITE.phone,
  email: SITE.email,
  founder: { "@type": "Person", name: SITE.founder },
  address: {
    "@type": "PostalAddress",
    addressLocality: "North Lauderdale",
    addressRegion: "FL",
    addressCountry: "US",
  },
  areaServed: "Southeast US",
  description:
    "Crew-sourcing and flight coordination for Part 91 aircraft owners: vetted contract pilots, maintenance ferries, and repositioning — quoted within 24 business hours, priced flat.",
};

const display = localFont({
  src: "../fonts/space-grotesk/space-grotesk-latin-wght.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
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
    <div className={`${display.variable} ${mono.variable} contents`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }}
      />
      <PublicShell>{children}</PublicShell>
    </div>
  );
}
