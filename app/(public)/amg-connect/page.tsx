import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, MessageSquareText, ReceiptText, ShieldCheck } from "lucide-react";
import { CtaBand, PageHero, SectionHeading } from "@/components/site/oc/shared";
import { PortalDashboardStack } from "@/components/site/portal-dashboard-stack";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "AMG Connect | AMG Aviation Group",
  description:
    "AMG Connect gives approved users visibility into support requests, messages, documents, quotes, invoices, and operational status.",
};

const visibleItems = [
  "Request status",
  "Messages",
  "Documents",
  "Quotes and invoices",
  "Aircraft/support context",
  "Role-based access",
] as const;

const audiences = [
  "Owners and representatives",
  "Flight departments",
  "Crew members",
  "Vendors and partners",
  "AMG operations/admin",
] as const;

const portalHighlights = [
  { title: "Requests", body: "Track request context and review status.", icon: MessageSquareText },
  { title: "Documents", body: "Keep approved support documents visible.", icon: FileText },
  { title: "Quotes & Invoices", body: "Review commercial follow-up where applicable.", icon: ReceiptText },
] as const;

export default function AmgConnectPage() {
  return (
    <>
      <PageHero
        eyebrow="AMG Connect"
        title="A clearer support view for approved users."
        lead="AMG Connect gives approved users a clearer way to view support requests, messages, documents, quotes, invoices, and operational status."
        image={IMG.generatedConnectDashboard}
        imageAlt="AMG Connect dashboard preview with support request visibility"
        primary={{ label: "Request AMG Connect Access", href: "/login?mode=request" }}
        secondary={{ label: "Member Login", href: "/login" }}
      />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="What Users Can See"
              title="The support picture, organized by role."
              lead="AMG Connect is a visibility layer for approved users. It helps keep request status, communication, documents, and commercial follow-up in one place."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {visibleItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-[var(--oc-line)] bg-white p-4 text-sm font-semibold text-[var(--oc-ink)]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <PortalDashboardStack priority />
        </div>
      </section>

      <section className="oc-section bg-[var(--oc-ivory-2)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="Who It Is For"
            title="Approved access for each support role."
            lead="Access is scoped to the user’s approved role and support context."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {audiences.map((audience) => (
              <article key={audience} className="oc-card rounded-lg p-5">
                <ShieldCheck className="h-5 w-5 text-[var(--oc-blue)]" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-[var(--oc-ink)]">{audience}</h2>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--oc-graphite)] py-16 text-white lg:py-24">
        <div className="oc-shell grid gap-5 md:grid-cols-3">
          {portalHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-lg border border-white/[0.12] bg-white/[0.05] p-6">
                <Icon className="h-6 w-6 text-[var(--oc-blue)]" aria-hidden="true" />
                <h2 className="mt-5 text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <CtaBand
        eyebrow="AMG Connect"
        title="Request access to AMG Connect."
        body="Portal visibility supports communication; it does not replace crew confirmation, operational approval, or final support acceptance."
        primaryLabel="Request AMG Connect Access"
        primaryHref="/login?mode=request"
        secondaryLabel="Member Login"
        secondaryHref="/login"
      />
    </>
  );
}
