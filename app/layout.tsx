import type { Metadata, Viewport } from "next";
import { CookieConsentBanner } from "@/components/compliance/cookie-consent";
import { ConsentScriptLoader } from "@/components/compliance/consent-script-loader";
import { SITE } from "@/lib/site-config";
import "./globals.css";

// Reuse the homepage hero still as the shared social-share card. metadataBase
// resolves this relative path to an absolute URL for crawlers.
const OG_IMAGE = {
  url: "/images/flightdeck/stratosphere.webp",
  width: 1920,
  height: 1072,
  alt: "AMG Aviation Group flight deck",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || SITE.url),
  title: {
    default: "AMG Aviation Group",
    template: "%s | AMG Aviation Group",
  },
  description:
    "Aircraft support capabilities, crew coordination, ferry and repositioning assistance, maintenance flight support, and owner communication for Part 91 aviation environments.",
  keywords: [
    "aircraft support capabilities",
    "aircraft management support",
    "Part 91 operations",
    "contract pilot support",
    "ferry repositioning",
    "maintenance flight support",
    "pilot network",
    "AMG Aviation Group",
  ],
  authors: [{ name: "AMG Aviation Group" }],
  openGraph: {
    title: "AMG Aviation Group - Aircraft Support Capabilities",
    description:
      "Aircraft support capabilities and coordination for Part 91 aviation environments.",
    type: "website",
    siteName: "AMG Aviation Group",
    url: SITE.url,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "AMG Aviation Group - Aircraft Support Capabilities",
    description:
      "Aircraft support capabilities and coordination for Part 91 aviation environments.",
    images: [OG_IMAGE.url],
  },
};

export const viewport: Viewport = {
  themeColor: "#050B14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background" data-scroll-behavior="smooth">
      <body
        style={
          {
            "--font-inter": "Inter, -apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Helvetica Neue\", Arial, sans-serif",
            "--font-sans": "var(--font-inter)",
            "--font-display": "var(--font-inter)",
          } as React.CSSProperties
        }
      >
        {children}
        <CookieConsentBanner />
        <ConsentScriptLoader />
      </body>
    </html>
  );
}
