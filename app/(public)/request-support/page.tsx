import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportRequestForm } from "@/components/site/support-request-form";

export const metadata: Metadata = {
  title: {
    absolute: "Request Aircraft Support | AMG Aviation Group",
  },
  description:
    "Request AMG Aviation Group aircraft support for crew coordination, ferry and repositioning, maintenance movement, flight operations coordination, aircraft management support, and plan review.",
};

export default async function RequestSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; category?: string; service?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const initialSupportPath =
    params.category === "subscription-program-inquiry" || params.plan
      ? "Plan / Subscription Review"
      : params.category === "contract-pilot-support"
        ? "Contract Pilot Support"
        : params.category === "maintenance-flight-support"
          ? "Maintenance Flight Support"
          : params.category === "ferry-and-repositioning"
            ? "Ferry & Repositioning"
            : undefined;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[var(--oc-navy)] pb-12 pt-[calc(var(--public-header-height)+4rem)] text-white lg:pb-16 lg:pt-[calc(var(--public-header-height)+5rem)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_5%,rgba(56,189,248,0.16),transparent_28rem)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />
        <div className="oc-shell">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.58fr] lg:items-end">
            <div>
              <p className="oc-eyebrow oc-eyebrow-light">AMG Support Request</p>
              <h1 className="oc-display mt-5 text-[clamp(2.75rem,7vw,5.25rem)] text-[var(--oc-paper)]">
                Request Aircraft Support
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
                Use this page to begin an aircraft support, crew coordination, ferry/repositioning, maintenance
                movement, plan review, or operational coordination request.
              </p>
              <p className="mt-5 max-w-3xl rounded-2xl border border-white/14 bg-white/8 p-4 text-sm leading-relaxed text-[var(--oc-aluminum)] backdrop-blur-md">
                AMG does not present a request as accepted until the support scope, aircraft status, crew availability,
                owner/operator approval, and operational conditions have been reviewed.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="min-h-11 rounded-full bg-white px-6 text-[var(--oc-navy)] hover:bg-white/90">
                  <a href="#support-request-form">
                    Start Request
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="min-h-11 rounded-full border-white/28 bg-white/5 px-6 text-white hover:bg-white/12 hover:text-white">
                  <Link href="/contact" prefetch={false}>General Contact</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
              {["Support scope", "Aircraft status", "Crew availability", "Owner/operator approval"].map((item) => (
                <div key={item} className="border-b border-white/10 py-3 text-sm font-semibold text-[var(--oc-paper)] last:border-b-0">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="support-request-form" className="oc-shell py-14 lg:py-20">
        <SupportRequestForm success={params.success} error={params.error} initialSupportPath={initialSupportPath} />
      </section>

      <section className="oc-shell pb-16 lg:pb-24">
        <div className="rounded-2xl border border-[var(--oc-line)] bg-white/72 p-6 shadow-[var(--oc-shadow)] backdrop-blur-xl">
          <p className="oc-eyebrow text-[var(--oc-blue)]">General Contact</p>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--oc-ink)]">Not requesting aircraft support?</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--oc-muted)]">
            For general questions, administrative requests, pilot network communication, vendor inquiries, or
            non-operational messages, use the general Contact page.
          </p>
          <Button asChild variant="outline" className="mt-6 min-h-11 rounded-full">
            <Link href="/contact" prefetch={false}>
              Contact AMG
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
