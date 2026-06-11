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
    default: "AMG Aviation Group — Private Aviation Management",
    template: "%s | AMG Aviation Group",
  },
  description:
    "Personalized aviation management and mission coordination. AMG Aviation Group delivers bespoke private flight operations, fleet oversight, and an elite pilot network under FAR Part 91.",
  keywords: [
    "private aviation",
    "aviation management",
    "Part 91 operations",
    "private jet",
    "fleet management",
    "pilot network",
    "AMG Aviation Group",
  ],
  authors: [{ name: "AMG Aviation Group" }],
  openGraph: {
    title: "AMG Aviation Group — Private Aviation Management",
    description:
      "Personalized aviation management and mission coordination under FAR Part 91.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#06111D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark bg-background ${inter.variable} ${barlow.variable}`}>
      <body
        style={
          {
            "--font-sans": "var(--font-inter)",
            "--font-display": "var(--font-barlow)",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
