import localFont from "next/font/local";
import { cookies } from "next/headers";
import { PortalIntroGate } from "@/components/portal/PortalIntroGate";
import { PORTAL_INTRO_PENDING_COOKIE } from "@/lib/portal/intro";
import { PORTAL_THEME_COOKIE, resolvePortalTheme } from "@/lib/portal/theme";

/**
 * Portal-scoped fonts (Horizon pairing, per the 2026 Brand & Voice Guide):
 * Barlow Condensed for display, Inter for UI text, JetBrains Mono for
 * refs/times/amounts. Loaded here — not in the root layout — so public
 * pages pay zero bytes for them. `.amg-portal` maps them onto
 * --font-display / --font-sans / --font-mono in globals.css.
 */
const display = localFont({
  src: [
    { path: "../fonts/barlow-condensed/barlow-condensed-latin-500.woff2", weight: "500" },
    { path: "../fonts/barlow-condensed/barlow-condensed-latin-600.woff2", weight: "600" },
    { path: "../fonts/barlow-condensed/barlow-condensed-latin-700.woff2", weight: "700" },
  ],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const sans = localFont({
  src: "../fonts/inter/inter-latin-wght.woff2",
  weight: "100 900",
  variable: "--font-inter-portal",
  display: "swap",
});

const mono = localFont({
  src: "../fonts/jetbrains-mono/jetbrains-mono-latin-wght.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialIntroPending =
    cookieStore.get(PORTAL_INTRO_PENDING_COOKIE)?.value === "1";
  const theme = resolvePortalTheme(cookieStore.get(PORTAL_THEME_COOKIE)?.value);

  return (
    <div
      className={`${display.variable} ${sans.variable} ${mono.variable} contents`}
      data-portal-theme={theme}
    >
      <PortalIntroGate initialIntroPending={initialIntroPending}>
        {children}
      </PortalIntroGate>
    </div>
  );
}
