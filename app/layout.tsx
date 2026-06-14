import type { Metadata, Viewport } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AMG Aviation Group — Aircraft Operations Support",
    template: "%s | AMG Aviation Group",
  },
  description:
    "Aircraft operations support, crew coordination, ferry and repositioning assistance, maintenance flight support, and owner communication for Part 91 aviation environments.",
  keywords: [
    "aircraft operations support",
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
    title: "AMG Aviation Group — Aircraft Operations Support",
    description:
      "Aircraft operations support and coordination for Part 91 aviation environments.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F8FB",
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
      className={`bg-background ${inter.variable} ${barlow.variable}`}
      // The inline script below sets data-js on <html> before hydration; this
      // opts that single element out of hydration attribute diffing.
      suppressHydrationWarning
    >
      <body
        style={
          {
            "--font-sans": "var(--font-inter)",
            "--font-display": "var(--font-barlow)",
          } as React.CSSProperties
        }
      >
        {/*
          Flag that JS is available BEFORE first paint. Scroll-reveal hiding in
          globals.css is scoped to :root[data-js="ready"], so when JS is absent
          the content stays fully visible (never hidden before JS runs).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.js="ready"`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
