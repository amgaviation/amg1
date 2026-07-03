import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Manrope } from "next/font/google";
import { CookieConsentBanner } from "@/components/compliance/cookie-consent";
import { ConsentScriptLoader } from "@/components/compliance/consent-script-loader";
import "./globals.css";

const displayFont = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const sansFont = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AMG Aviation Group — Private Aircraft Support, Coordinated",
    template: "%s | AMG Aviation Group",
  },
  description:
    "AMG Aviation Group coordinates aircraft movement, contract crew support, maintenance repositioning, and recurring operational support for private aircraft owners, Part 91 operators, and flight departments.",
  keywords: [
    "private aircraft support",
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
    title: "AMG Aviation Group — Private Aircraft Support, Coordinated",
    description:
      "Aircraft movement, crew support, maintenance repositioning, and recurring operational support for private aircraft owners, operators, and flight departments.",
    type: "website",
    siteName: "AMG Aviation Group",
  },
};

export const viewport: Viewport = {
  themeColor: "#060A14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-background ${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
      data-scroll-behavior="smooth"
    >
      <body
        style={
          {
            "--font-inter": "var(--font-manrope), -apple-system, BlinkMacSystemFont, \"Helvetica Neue\", Arial, sans-serif",
            "--font-sans": "var(--font-manrope), -apple-system, BlinkMacSystemFont, \"Helvetica Neue\", Arial, sans-serif",
            "--font-display": "var(--font-archivo), -apple-system, BlinkMacSystemFont, \"Helvetica Neue\", Arial, sans-serif",
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
