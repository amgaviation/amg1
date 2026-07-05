import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { QuoteRequestForm } from "./quote-request-form";
import { PhoneLink } from "@/components/site/tracked-link";

export const metadata: Metadata = {
  title: "Request a Quote — Written Answer in 24 Business Hours",
  description:
    "One form, five minutes: aircraft, mission, dates, insurance carrier. A named coordinator replies with a written, itemized quote within 24 business hours.",
};

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  return (
    <>
      <section className="oc-shell pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">Request a Quote</p>
          <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">
            Five minutes now. A written quote in 24 business hours.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            No phone tag. Submit the mission and a named coordinator replies with pilot options,
            qualifications, and an itemized all-in cost. Prefer to talk?{" "}
            <PhoneLink source="request_page" className="oc-mono text-[var(--oc-paper)] underline-offset-2 hover:underline" />
          </p>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell max-w-3xl">
          {success ? (
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
          ) : (
            <QuoteRequestForm error={error} />
          )}
        </div>
      </section>
    </>
  );
}
