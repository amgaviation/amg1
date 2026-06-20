import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { PageHero, SectionHeading, CtaBand } from "@/components/site/oc/shared";
import { ConnectPreview } from "@/components/site/home/connect-preview";
import { PORTAL_ROLES } from "@/lib/content";
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
        eyebrow={hero.eyebrow ?? "AMG Connect"}
        title={hero.headline ?? "One support view for approved stakeholders."}
        lead={hero.body}
        image={imageSrcForKey(hero.imageKey) ?? "/images/portal-screenshots/portal-client-dashboard-enhanced.webp"}
        imageAlt="AMG client portal dashboard showing support requests and aircraft records"
        primary={hero.primaryCtaLabel && hero.primaryCtaHref ? { label: hero.primaryCtaLabel, href: hero.primaryCtaHref } : undefined}
        secondary={hero.secondaryCtaLabel && hero.secondaryCtaHref ? { label: hero.secondaryCtaLabel, href: hero.secondaryCtaHref } : undefined}
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
