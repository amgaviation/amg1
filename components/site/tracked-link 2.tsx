"use client";

import Link from "next/link";
import { trackSiteEvent } from "@/lib/site-analytics";
import type { SiteEventName } from "@/lib/site-config";
import { SITE, SITE_EVENTS } from "@/lib/site-config";

/** Internal link that fires an analytics event on click. */
export function TrackedLink({
  href,
  event,
  eventParams,
  className,
  children,
  ...rest
}: {
  href: string;
  event: SiteEventName;
  eventParams?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      onClick={() => trackSiteEvent(event, eventParams)}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** tel: link for the published phone number; fires the phone_tap event. */
export function PhoneLink({
  className,
  label,
  source,
}: {
  className?: string;
  label?: string;
  source: string;
}) {
  return (
    <a
      href={SITE.phoneHref}
      className={className}
      onClick={() => trackSiteEvent(SITE_EVENTS.phoneTap, { source })}
    >
      {label ?? SITE.phone}
    </a>
  );
}
