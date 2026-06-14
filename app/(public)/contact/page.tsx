import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { RevealGroup, RevealItem } from "@/components/site/reveal";
import { COMPANY, CONTACT_CARDS } from "@/lib/content";
import { PublicSupportForm } from "@/components/site/public-support-form";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Support Request",
  description:
    "Contact AMG Aviation Group for aircraft management support, crew coordination, ferry or repositioning assistance, maintenance flight support, or general operational support.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; service?: string; aircraft?: string; plan?: string; success?: string; error?: string; duplicate?: string }>;
}) {
  const params = await searchParams;
  const supportType = params.category || params.service || params.aircraft || params.plan || "";
  return (
    <>
      <PageHero
        eyebrow="Contact AMG"
        title="Start a Support Request"
        description="Use this page to request aircraft management support, crew coordination, ferry or repositioning assistance, maintenance flight support, or general operational support."
        image="/images/light-jet.png"
      />
      <section className="cinematic-band py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <aside>
            <div className="media-vignette mb-6 overflow-hidden rounded-lg border border-white/10 bg-card" data-scroll-animate>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/turboprop.png"
                alt="Turboprop aircraft representing regional support requests and positioning needs"
                className="h-full w-full object-cover"
              />
            </div>
            <RevealGroup className="grid gap-4">
              {CONTACT_CARDS.map((card) => (
                <RevealItem key={card.title}>
                  <div className="glass-panel hover-lift rounded-lg p-6 hover:border-accent/60">
                    <p className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">{card.title}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  </div>
                </RevealItem>
              ))}
              <RevealItem>
                <div className="glass-panel rounded-lg p-6">
                  <Mail className="h-6 w-6 text-accent" />
                  <p className="eyebrow mt-5 text-[0.7rem] text-muted-foreground">Email</p>
                  <a href={`mailto:${COMPANY.email}`} className="mt-2 block text-lg text-foreground hover:text-accent">{COMPANY.email}</a>
                </div>
              </RevealItem>
            </RevealGroup>
          </aside>
          <PublicSupportForm
            initialCategory={supportType}
            success={params.success}
            error={params.error}
            duplicate={params.duplicate}
          />
        </div>
      </section>
    </>
  );
}
