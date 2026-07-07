import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you requested could not be found.",
};

/**
 * Branded 404 for the public site — rendered inside the (public) layout,
 * so it carries the standard nav and footer. Neutral copy, three routes
 * out (spec: Home, Pricing, Request a Quote).
 */
export default function PublicNotFound() {
  return (
    <section className="oc-shell flex min-h-[70vh] flex-col items-start justify-center pt-[calc(var(--public-header-height)+4rem)] pb-24">
      <p className="oc-eyebrow oc-eyebrow-light">404 // Page Not Found</p>
      <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">
        Page not found.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
        The page you requested doesn&rsquo;t exist or has moved.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href="/" prefetch={false} className="oc-btn oc-btn-ghost-dark">
          Home
        </Link>
        <Link href="/pricing" prefetch={false} className="oc-btn oc-btn-ghost-dark">
          Pricing
        </Link>
        <Link href="/request" prefetch={false} className="oc-btn oc-btn-light">
          Request a Quote
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
