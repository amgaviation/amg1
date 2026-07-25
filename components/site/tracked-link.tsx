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

/**
 * tel: link for the published phone number; fires the phone_tap event.
 *
 * `children` wins over `label` so callers can render an icon-only tap target
 * (pass `label=""` and an aria-label). Remaining props forward to the anchor.
 */
export function PhoneLink({
  className,
  label,
  source,
  children,
  ...rest
}: {
  className?: string;
  label?: string;
  source: string;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<"a">, "href" | "onClick" | "className" | "children">) {
  return (
    <a
      href={SITE.phoneHref}
      className={className}
      onClick={() => trackSiteEvent(SITE_EVENTS.phoneTap, { source })}
      {...rest}
    >
      {children ?? label ?? SITE.phone}
    </a>
  );
}
