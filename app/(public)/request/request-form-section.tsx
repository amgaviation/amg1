"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { QuoteRequestForm } from "./quote-request-form";

/**
 * Reads success/error from the query string on the client so the /request
 * route can stay fully static (no server-side searchParams read).
 */
function RequestOutcome() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error") ?? undefined;

  if (success) {
    return (
      <div className="oc-card-dark p-8 text-center lg:p-10" role="status">
        <h2 className="oc-display text-3xl text-[var(--oc-paper)]">Received.</h2>
        <p className="mt-4 text-base leading-relaxed text-[var(--oc-aluminum)]">
          You&apos;ll have a written quote within 24 business hours — or your plan&apos;s
          window if you&apos;re a member. It will come from a named coordinator.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/how-it-works" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            What happens next
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return <QuoteRequestForm error={error} />;
}

export function RequestFormSection() {
  return (
    // useSearchParams requires a Suspense boundary; the fallback prerenders the
    // plain form so the static shell still contains it.
    <Suspense fallback={<QuoteRequestForm />}>
      <RequestOutcome />
    </Suspense>
  );
}
