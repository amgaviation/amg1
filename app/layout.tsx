import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
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
      className={`bg-background ${montserrat.variable}`}
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
      </body>
    </html>
  );
}
