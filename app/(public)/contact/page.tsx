import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { PageHero } from "@/components/site/oc/shared";
import { COMPANY, CONTACT_CARDS } from "@/lib/content";
import { PublicSupportForm } from "@/components/site/public-support-form";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "Request Support",
  description:
    "Submit a Support Request to AMG Aviation Group for aircraft movement, crew coverage, maintenance repositioning, ferry coordination, or mission-specific support.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    service?: string;
    aircraft?: string;
    plan?: string;
    success?: string;
    error?: string;
    duplicate?: string;
  }>;
}) {
  const params = await searchParams;
  const supportType = params.category || params.service || params.aircraft || params.plan || "";

  return (
    <>
      <PageHero
        eyebrow="Request Support"
        title="Start with the aircraft."
        lead="Tell us the aircraft, the movement or coverage need, and the timing. AMG will review the support path and respond — no request is presented as accepted until the review is complete."
        image={IMG.contactSupport}
        imageAlt="AMG operations desk coordinating an aircraft support request"
      />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="grid min-w-0 gap-4" data-stagger-container>
            {CONTACT_CARDS.map((card) => (
              <div key={card.title} data-stagger-item className="oc-card p-6">
                <h2 className="oc-display text-xl text-[var(--oc-ink)]">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">{card.body}</p>
              </div>
            ))}
            <div data-stagger-item className="oc-card p-6">
              <Mail className="h-5 w-5 text-[var(--oc-blue)]" />
              <p className="oc-kicker mt-4 text-[var(--oc-muted)]">Email</p>
              <a
                href={`mailto:${COMPANY.email}`}
                className="mt-1.5 block text-lg text-[var(--oc-ink)] transition-colors hover:text-[var(--oc-blue)]"
              >
                {COMPANY.email}
              </a>
              <p className="oc-mono mt-4 text-xs text-[var(--oc-muted)]">{COMPANY.location}</p>
            </div>
          </aside>

          <div className="min-w-0" data-scroll-animate>
            <PublicSupportForm
              initialCategory={supportType}
              success={params.success}
              error={params.error}
              duplicate={params.duplicate}
            />
          </div>
        </div>
      </section>
    </>
  );
}
