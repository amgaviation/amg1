import type { Metadata } from "next";
import { CtaSection } from "@/components/site/cta-section";
import { PageHero } from "@/components/site/page-hero";
import { RevealGroup, RevealItem } from "@/components/site/reveal";
import { TEAM } from "@/lib/content";

export const metadata: Metadata = {
  title: "Team",
  description: "The AMG Aviation Group operations structure supporting clients, crew, and administrators.",
};

export default function TeamPage() {
  return (
    <>
      <PageHero
        eyebrow="AMG Team"
        title="The people and roles behind every mission"
        description="AMG Connect is designed around the real operation: clients, crew, admin staff, and the mission coordination desk."
        image="/images/heavy-jet.png"
      />
      <section className="cinematic-band py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" data-scroll-animate>
            {TEAM.map((member) => (
              <RevealItem key={member.name}>
                <article className="hover-lift h-full rounded-lg border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(8,20,36,0.07)]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/50 bg-accent/10 font-display text-2xl font-extrabold text-accent">
                    {member.initials}
                  </div>
                  <h2 className="mt-8 font-display text-2xl font-bold uppercase tracking-wide text-slate-950">{member.name}</h2>
                  <p className="eyebrow mt-2 text-[0.65rem] text-accent">{member.title}</p>
                  <p className="mt-5 leading-relaxed text-slate-600">{member.bio}</p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <CtaSection title="Bring the whole operation into view" primaryHref="/login" primaryLabel="Member login" />
    </>
  );
}
