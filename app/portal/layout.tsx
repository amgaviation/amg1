import localFont from "next/font/local";
import { cookies } from "next/headers";
import { PortalIntroGate } from "@/components/portal/PortalIntroGate";
import { PORTAL_INTRO_PENDING_COOKIE } from "@/lib/portal/intro";
import { PORTAL_THEME_COOKIE, resolvePortalTheme } from "@/lib/portal/theme";

/**
 * Portal-scoped fonts (Flight Deck pairing): Space Grotesk for display,
 * JetBrains Mono for microlabels/data. Loaded here — not in the root layout —
 * so public pages pay zero bytes for them. `.amg-portal` maps them onto
 * --font-display / --font-mono in globals.css.
 */
const display = localFont({
  src: "../fonts/space-grotesk/space-grotesk-latin-wght.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
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
      className={`${display.variable} ${mono.variable} contents`}
      data-portal-theme={theme}
    >
      <PortalIntroGate initialIntroPending={initialIntroPending}>
        {children}
      </PortalIntroGate>
    </div>
  );
}
