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

      <section className="bg-[#000000] py-24 lg:py-32">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="Role views"
            title="Access scoped to the support role."
            lead="Approved users receive only the request, document, communication, and status context their role requires."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
            {PORTAL_ROLES.map((role) => (
              <article
                key={role.id}
                data-stagger-item
                className="flex h-full flex-col rounded-2xl border border-neutral-900 bg-[#0a0a0a] p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold tracking-tighter text-white">{role.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{role.access}</p>
                <ul className="mt-5 grid gap-2 border-t border-neutral-900 pt-5">
                  {role.actions.map((action) => (
                    <li key={action} className="flex items-start gap-2.5 text-sm text-neutral-400">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/60" />
                      {action}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/login"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-widest text-black transition-all duration-200 hover:bg-white/88"
            >
              Member Login
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="AMG Connect"
        title="Request access to the portal."
        body="Portal visibility supports communication; it does not replace crew confirmation, operational approval, or final support acceptance."
        primaryLabel="Request Access"
        primaryHref="/login?mode=request"
        secondaryLabel="Member Login"
        secondaryHref="/login"
      />
    </>
  );
}
