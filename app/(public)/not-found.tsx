import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function PublicNotFound() {
  return (
    <section className="public-editorial-section min-h-[72svh] pt-[calc(var(--public-header-height)+4rem)]">
      <div className="oc-shell max-w-4xl">
        <p className="oc-eyebrow oc-eyebrow-light">404</p>
        <h1 className="oc-display mt-5 text-5xl text-[var(--oc-paper)] sm:text-6xl">
          The requested AMG public page was not found.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
          Use the public navigation, start a support request, or contact AMG for the correct route.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/" prefetch={false} className="oc-btn oc-btn-light">
            Homepage
          </Link>
          <Link href="/request-support" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            Start a Support Request
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href="/contact" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            Contact AMG
          </Link>
        </div>
      </div>
    </section>
  );
}
