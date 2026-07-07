import type { Metadata } from "next";
import localFont from "next/font/local";
import { PublicShell } from "@/components/site/public-shell";
import PublicNotFound from "./(public)/not-found";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you requested could not be found.",
};

const display = localFont({
  src: "./fonts/space-grotesk/space-grotesk-latin-wght.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

const mono = localFont({
  src: "./fonts/jetbrains-mono/jetbrains-mono-latin-wght.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/**
 * Root 404 — fully unmatched URLs never enter the (public) route group, so
 * its not-found boundary can't catch them. This composes the same public
 * shell + fonts as app/(public)/layout.tsx around the shared 404 card.
 */
export default function RootNotFound() {
  return (
    <div className={`${display.variable} ${mono.variable} contents`}>
      <PublicShell>
        <PublicNotFound />
      </PublicShell>
    </div>
  );
}
