"use client";

import { usePathname } from "next/navigation";
import { CookieConsentBanner } from "@/components/compliance/cookie-consent";
import { ConsentScriptLoader } from "@/components/compliance/consent-script-loader";

/**
 * Route gate for the sitewide consent UI.
 *
 * The banner is AMG-branded and links to AMG's cookie policy, and the loader
 * injects AMG's analytics properties. The `/studio` route is a separate brand
 * (3 Green Studios) that must carry no AMG reference at all, and it loads no
 * third-party scripts of its own — so both are skipped there. Every other route
 * behaves exactly as before.
 */
const CONSENT_EXEMPT_PREFIXES = ["/studio"];

export function SiteConsent() {
  const pathname = usePathname();
  if (pathname && CONSENT_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <>
      <CookieConsentBanner />
      <ConsentScriptLoader />
    </>
  );
}
