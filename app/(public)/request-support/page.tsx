import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportRequestForm } from "@/components/site/support-request-form";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: {
    absolute: "Request aircraft support | AMG Aviation Group",
  },
  description:
    "Submit aircraft, location, timing, crew coverage, aircraft movement, maintenance repositioning, or recurring support details for AMG review.",
};

export default async function RequestSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; category?: string; service?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const CATEGORY_TO_SUPPORT_PATH: Record<string, string> = {
    "subscription-program-inquiry": "Plan / Subscription Review",
    "contract-pilot-support": "Contract Pilot Support",
    "maintenance-flight-support": "Maintenance Flight Support",
    "ferry-and-repositioning": "Ferry & Repositioning",
    "ferry-repositioning": "Ferry & Repositioning",
    "aircraft-management-support": "Aircraft Management Support",
    "flight-operations-coordination": "Flight Operations Coordination",
    "fleet-support-programs": "Fleet Support Program",
    "pilot-network": "Pilot Network Inquiry",
  };
  const initialSupportPath = params.plan
    ? "Plan / Subscription Review"
    : params.category
      ? CATEGORY_TO_SUPPORT_PATH[params.category]
      : undefined;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[var(--oc-navy)] pb-12 pt-[calc(var(--public-header-height)+4rem)] text-white lg:pb-16 lg:pt-[calc(var(--public-header-height)+5rem)]">
        <Image
          src={IMG.generatedDispatch}
          alt=""
          fill
          priority
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover opacity-[0.36]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,11,20,0.98),rgba(7,17,31,0.84)_52%,rgba(5,11,20,0.94)),radial-gradient(circle_at_82%_5%,rgba(59,130,246,0.16),transparent_28rem)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />
        <div className="oc-shell">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.58fr] lg:items-end">
            <div>
              <p className="oc-eyebrow oc-eyebrow-light">Aircraft support request</p>
              <h1 className="oc-display mt-5 text-[clamp(2.75rem,7vw,5.25rem)] text-[var(--oc-paper)]">
                Tell us what the aircraft needs.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
                Share the aircraft, location, timing, requested support, and known constraints. AMG will review feasibility and provide a clear next step.
              </p>
              <p className="mt-5 max-w-3xl rounded-2xl border border-white/[0.14] bg-white/[0.08] p-4 text-sm leading-relaxed text-[var(--oc-aluminum)] backdrop-blur-md">
                AMG does not present a request as accepted until the support scope, aircraft status, crew availability,
                owner/operator approval, and operational conditions have been reviewed.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="min-h-11 rounded-full bg-white px-6 text-[var(--oc-navy)] hover:bg-white/90">
                  <a href="#support-request-form">
                    Submit for review
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="min-h-11 rounded-full border-white/[0.28] bg-white/[0.05] px-6 text-white hover:bg-white/[0.12] hover:text-white"
                >
                  <Link href="/contact" prefetch={false}>
                    General Contact
                  </Link>
                </Button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.08] shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              <div className="relative aspect-[4/3]">
                <Image
                  src={IMG.generatedDispatch}
                  alt="Flight planning desk with route coordination materials"
                  fill
                  sizes="(max-width: 1024px) 100vw, 34vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--oc-navy)] via-[var(--oc-navy)]/20 to-transparent" />
              </div>
              <div className="p-5">
                <p className="oc-kicker text-[var(--oc-aluminum)]">Review inputs</p>
                {["Support scope", "Aircraft status", "Crew availability", "Owner/operator approval"].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 border-b border-white/[0.10] py-3 text-sm font-semibold text-[var(--oc-paper)] last:border-b-0"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[var(--oc-accent)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="support-request-form" className="oc-shell py-14 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.38fr_1fr] lg:items-start">
          <aside className="lg:sticky lg:top-[calc(var(--public-header-height)+2rem)]">
            <div className="overflow-hidden rounded-2xl border border-[var(--oc-line)] bg-white shadow-[var(--oc-shadow)]">
              <div className="relative aspect-[4/3]">
                <Image
                  src={IMG.generatedDispatch}
                  alt="Aviation dispatch planning materials for support request review"
                  fill
                  sizes="(max-width: 1024px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--oc-graphite)]/78 to-transparent" />
                <p className="oc-kicker absolute bottom-4 left-4 text-white">Operational review</p>
              </div>
              <div className="p-5">
                <h2 className="text-xl font-semibold text-[var(--oc-ink)]">Before acceptance</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">
                  Requests are reviewed against the aircraft record, support scope, operational timing, and required
                  stakeholder approvals.
                </p>
                <div className="mt-5 grid gap-3">
                  {[
                    "Aircraft and location context",
                    "Crew and support availability",
                    "Route, timing, and operating conditions",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm font-semibold text-[var(--oc-ink)]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          <SupportRequestForm success={params.success} error={params.error} initialSupportPath={initialSupportPath} />
        </div>
      </section>

      <section className="oc-shell pb-16 lg:pb-24">
        <div className="rounded-2xl border border-[var(--oc-line)] bg-white/[0.72] p-6 shadow-[var(--oc-shadow)] backdrop-blur-xl">
          <p className="oc-eyebrow text-[var(--oc-blue)]">General Contact</p>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--oc-ink)]">Not requesting aircraft support?</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--oc-muted)]">
            For general questions, administrative requests, pilot network communication, vendor inquiries, or
            non-operational messages, use the general Contact page.
          </p>
          <Button asChild variant="outline" className="mt-6 min-h-11 rounded-full">
            <Link href="/contact" prefetch={false}>
              Send general inquiry
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
