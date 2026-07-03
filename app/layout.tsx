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
    "AMG Aviation Group coordinates aircraft movement, crew support, maintenance repositioning, and recurring operational support for private aviation clients.",
  keywords: [
    "private aircraft support",
    "aircraft movement coordination",
    "Part 91 support",
    "contract crew support",
    "maintenance repositioning",
    "pilot network",
    "AMG Aviation Group",
  ],
  authors: [{ name: "AMG Aviation Group" }],
  openGraph: {
    title: "Private Aircraft Support, Coordinated | AMG Aviation Group",
    description:
      "AMG Aviation Group coordinates aircraft movement, crew support, maintenance repositioning, and recurring operational support for private aviation clients.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Aircraft Support, Coordinated | AMG Aviation Group",
    description:
      "AMG Aviation Group coordinates aircraft movement, crew support, maintenance repositioning, and recurring operational support for private aviation clients.",
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
