import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { PageHero, SectionHeading, CtaBand } from "@/components/site/oc/shared";
import { ConnectPreview } from "@/components/site/home/connect-preview";
import { PORTAL_ROLES } from "@/lib/content";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "AMG Connect",
  description:
    "AMG Connect is the role-based portal for approved owners, crews, and administrators — support requests, aircraft profiles, documents, quotes, and status in one place.",
};

export default function AmgConnectPage() {
  return (
    <>
      <PageHero
        eyebrow="AMG Connect"
        title="One support view for approved stakeholders."
        lead="Support requests, aircraft profiles, crew review, documents, quotes, invoices, and status updates are organized by role so owners, crews, and administrators can work from the same support picture."
        image={IMG.mapNetwork}
        imageAlt="Route and dispatch map used for operational coordination"
        primary={{ label: "Member Login", href: "/login" }}
        secondary={{ label: "Request Access", href: "/login?mode=request" }}
      />

      <ConnectPreview />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="Role views"
            title="Access scoped to the support role."
            lead="Every user sees what their role needs — and nothing it does not. Portal access is reviewed and approved before it is granted."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
            {PORTAL_ROLES.map((role) => (
              <article key={role.id} data-stagger-item className="oc-card flex h-full flex-col p-6">
                <h3 className="oc-display text-2xl text-[var(--oc-ink)]">{role.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">{role.access}</p>
                <ul className="mt-5 grid gap-2 border-t border-[var(--oc-line)] pt-5">
                  {role.actions.map((action) => (
                    <li key={action} className="flex items-start gap-2.5 text-sm text-[var(--oc-ink)]/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue)]" />
                      {action}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/login" prefetch={false} className="oc-btn oc-btn-primary">
              Member Login
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="AMG Connect"
        title="Request access to the portal."
        body="Approved owners, crews, and partners get a role-based view of support activity. Portal visibility does not replace crew confirmation, operational approval, or final support acceptance."
        primaryLabel="Request Access"
        primaryHref="/login?mode=request"
        secondaryLabel="Member Login"
        secondaryHref="/login"
      />
    </>
  );
}
