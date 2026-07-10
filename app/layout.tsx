import type { Metadata, Viewport } from "next";
import { CookieConsentBanner } from "@/components/compliance/cookie-consent";
import { ConsentScriptLoader } from "@/components/compliance/consent-script-loader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://www.amgaviationgroup.com",
  ),
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
  // "./" resolves against metadataBase + the current pathname, so every page
  // self-canonicalizes to the www host (also disarms the vercel.app alias).
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Contract Pilots & Aircraft Movement for Part 91 Owners",
    description:
      "Vetted contract pilots, maintenance ferries, and repositioning — quoted within 24 business hours, tracked in one portal, priced flat. Serving the Southeast US.",
    url: "./",
    siteName: "AMG Aviation Group",
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AMG Aviation Group — contract pilots and aircraft movement for Part 91 owners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
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
