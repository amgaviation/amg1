import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { CookieConsentBanner } from "@/components/compliance/cookie-consent";
import { ConsentScriptLoader } from "@/components/compliance/consent-script-loader";
import "./globals.css";

const montserrat = localFont({
  src: [
    {
      path: "./fonts/montserrat/montserrat-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/montserrat/montserrat-latin-wght-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "AMG Aviation Group - Aircraft Support Capabilities",
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
  themeColor: "#000000",
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
      className={`bg-black ${montserrat.variable}`}
    >
      <body
        style={
          {
            "--font-sans": "var(--font-montserrat)",
            "--font-display": "var(--font-montserrat)",
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
