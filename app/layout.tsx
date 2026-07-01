import type { Metadata, Viewport } from "next";
import { CookieConsentBanner } from "@/components/compliance/cookie-consent";
import { ConsentScriptLoader } from "@/components/compliance/consent-script-loader";
import "./globals.css";

export const metadata: Metadata = {
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
