import { PageHero, SectionHeading, CtaBand, Figure } from "@/components/site/oc/shared";
import { CrewNetworkHeroGlobe } from "@/components/sections/crew-network-hero-globe";
import { CrewNetworkSecondaryGlobe } from "@/components/sections/crew-network-secondary-globe";
import { PILOT_REQUIREMENTS, PILOT_BENEFITS } from "@/lib/content";
import { IMG } from "@/lib/site-media";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("crew-network", {
  title: "Crew Network",
  description:
    "A credential-reviewed crew network organized by base airport, aircraft experience, documents, availability, and assignment suitability.",
});

export default function CrewNetworkPage() {
  const hero = heroForWebsiteContent("crew-network", {
    eyebrow: "Crew Network",
    title: "Crew coverage reviewed by aircraft, role, and assignment.",
    lead: "AMG organizes pilots and aviation professionals around base airport, aircraft experience, documents, and suitability — so crew support is reviewed against the aircraft need, not treated as an automatic placement.",
    image: IMG.pilotNetwork,
    imageAlt: "Flight crew walking the ramp toward an aircraft",
    primary: { label: "Submit Credentials", href: "/credential-submission" },
    secondary: { label: "Member login", href: "/login" },
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

      <CrewNetworkHeroGlobe />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell grid items-center gap-12 lg:grid-cols-2">
          <div data-scroll-animate>
            <SectionHeading
              eyebrow="How the network works"
              title="Reviewed before assignment, every time."
              lead="Profiles are organized around the details that actually determine whether a crew member can support a specific aircraft need."
            />
            <ol className="mt-8 grid gap-3" data-stagger-container>
              {PILOT_REQUIREMENTS.map((req, i) => (
                <li key={req} data-stagger-item className="oc-card flex items-center gap-4 p-5">
                  <span className="oc-mono text-sm text-[var(--oc-blue)]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[15px] leading-snug text-[var(--oc-ink)]/85">{req}</span>
                </li>
              ))}
            </ol>
          </div>
          <div data-scroll-animate>
            <Figure
              src={IMG.pilotPreflight}
              alt="Pilot completing a preflight inspection"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-[4/5] rounded-[1.25rem]"
            />
          </div>
        </div>
      </section>

      <section className="oc-section bg-[var(--oc-ivory-2)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="For crew"
            title="What approved users can expect."
            lead="The network is built for credential organization, assignment context, and clear communication — not a casual job board or guaranteed placement system."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2" data-stagger-container>
            {PILOT_BENEFITS.map((b) => (
              <article key={b.title} data-stagger-item className="oc-card h-full p-7">
                <h3 className="oc-display text-2xl text-[var(--oc-ink)]">{b.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-[var(--oc-muted)]">{b.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CrewNetworkSecondaryGlobe />

      <CtaBand
        eyebrow="Crew Network"
        title="Submit credentials for crew network review."
        body="Profile submission helps AMG review qualifications, aircraft experience, documents, base airport, and support suitability. Submission and approval do not guarantee assignment, compensation, or future engagement."
        primaryLabel="Submit Credentials"
        primaryHref="/credential-submission"
        secondaryLabel="Member login"
        secondaryHref="/login"
      />
    </>
  );
}
