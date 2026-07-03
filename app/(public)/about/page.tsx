import { PageHero, SectionHeading, CtaBand, Figure } from "@/components/site/oc/shared";
import { COMPANY, VALUES, TEAM } from "@/lib/content";
import { IMG } from "@/lib/site-media";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("about", {
  title: "About AMG",
  description:
    "AMG Aviation Group provides structured aircraft support coordination for owner/operator and Part 91 environments — not charter, not an air carrier.",
});

export default function AboutPage() {
  const hero = heroForWebsiteContent("about", {
    eyebrow: "About AMG",
    title: "Built around real aircraft support needs.",
    lead: "AMG Aviation Group provides structured coordination for aircraft owners, flight departments, crews, and approved representatives while keeping operating authority, aircraft approval, and pilot-in-command responsibility clearly assigned.",
    image: IMG.aboutOperations,
    imageAlt: "AMG operations environment",
    primary: { label: "Request Aircraft Support", href: "/booking-request" },
    secondary: { label: "Pilot Network", href: "/pilot-network" },
  });

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        lead={hero.lead}
        image={hero.image}
        imageAlt={hero.imageAlt}
        primary={hero.primary}
        secondary={hero.secondary}
      />

      <section id="what-amg-does" className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div data-scroll-animate>
            <SectionHeading
              eyebrow="What AMG does"
              title="Coordination for the work around the aircraft."
              lead="AMG organizes the communication, documentation, and review work that surrounds aircraft support requests."
            />
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--oc-muted)]">
              {COMPANY.disclaimer}
            </p>
          </div>
          <div data-scroll-animate>
            <Figure
              src={IMG.runway}
              alt="Aircraft positioned on a runway at dusk"
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="aspect-[4/3] rounded-[1.25rem]"
            />
          </div>
        </div>
      </section>

      <section id="operating-principles" className="oc-section bg-[var(--oc-ivory-2)]">
        <div className="oc-shell">
          <SectionHeading eyebrow="How we operate" title="Four principles that hold every request." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
            {VALUES.map((value, i) => (
              <article key={value.title} data-stagger-item className="oc-card flex h-full flex-col p-6">
                <span className="oc-mono text-sm text-[var(--oc-blue)]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="oc-display mt-3 text-2xl text-[var(--oc-ink)]">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="support-desk" className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="Support desk"
            title="Four functions behind the support desk."
            lead="The support structure keeps the company story here and leaves service detail on the Services page."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
            {TEAM.map((member) => (
              <article key={member.name} data-stagger-item className="oc-card flex h-full flex-col p-6">
                <span className="oc-display text-3xl text-[var(--oc-aluminum-2)]">{member.initials}</span>
                <h3 className="oc-display mt-4 text-xl text-[var(--oc-ink)]">{member.name}</h3>
                <p className="oc-kicker mt-1 text-[var(--oc-blue)]">{member.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{member.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
