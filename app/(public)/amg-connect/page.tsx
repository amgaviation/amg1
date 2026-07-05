import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { PageHero, SectionHeading, CtaBand } from "@/components/site/oc/shared";
import { ConnectPreview } from "@/components/site/home/connect-preview";
import { PORTAL_ROLES } from "@/lib/content";
import { IMG } from "@/lib/site-media";
import { getWebsiteContentPage, imageSrcForKey } from "@/lib/website-editor/content";

const content = getWebsiteContentPage("amg-connect");

export const metadata: Metadata = {
  title: content.seo.title,
  description: content.seo.description,
};

export default function AmgConnectPage() {
  const hero = content.sections.hero;
  return (
    <>
      <PageHero
        eyebrow="AMG Connect"
        title="One place to follow aircraft support."
        lead="Approved owners, crew members, partners, and AMG administrators can view the requests, documents, messages, quotes, invoices, and status information relevant to their role."
        image={imageSrcForKey(hero.imageKey) ?? IMG.portalClientDashboard}
        imageAlt="Portal preview showing support requests and aircraft records"
        primary={{ label: "Member login", href: "/login" }}
        secondary={{ label: "Request portal access", href: "/login?mode=request" }}
      />

      <ConnectPreview />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="Role views"
            title="Visibility scoped to each role."
            lead="Portal access supports communication and record visibility. It does not confirm crew availability, aircraft movement, or operational acceptance."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
            {PORTAL_ROLES.map((role) => (
              <article key={role.id} data-stagger-item className="oc-card flex h-full flex-col p-6">
                <h3 className="oc-display text-2xl text-[var(--oc-ink)]">{role.id === "admin" ? "AMG Operations" : role.title.replace(" Portal", "")}</h3>
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
              Member login
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="AMG Connect"
        title="Request access to AMG Connect."
        body="Portal visibility supports communication; it does not replace crew confirmation, operational approval, or final support acceptance."
        primaryLabel="Request portal access"
        primaryHref="/login?mode=request"
        secondaryLabel="Member login"
        secondaryHref="/login"
      />
    </>
  );
}
