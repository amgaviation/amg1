import { PageHero, SectionHeading, CtaBand } from "@/components/site/oc/shared";
import { IMG } from "@/lib/site-media";
import { heroForWebsiteContent, metadataForWebsiteContent } from "@/lib/website-editor/content";

export const metadata = metadataForWebsiteContent("faqs", {
  title: "AMG Aviation FAQs",
  description: "Answers about AMG Aviation support requests, review, portal access, quotes, and service limitations.",
});

const FAQS = [
  {
    question: "Does submitting a request mean support has been accepted?",
    answer:
      "No. AMG reviews aircraft status, scope, crew availability, owner or operator authority, route conditions, timing, and other operational inputs before support is accepted.",
  },
  {
    question: "Can AMG guarantee crew availability?",
    answer:
      "No. Crew support depends on qualifications, availability, aircraft type, insurance context, assignment scope, and final review.",
  },
  {
    question: "Who can access AMG Connect?",
    answer:
      "Portal access is limited to approved users and scoped by role. Access can be suspended or changed when the support relationship or operational need changes.",
  },
  {
    question: "Are quotes or plans automatic?",
    answer:
      "No. Pricing, plans, and quotes depend on the reviewed support scope, aircraft category, timing, expected frequency, and pass-through expenses where applicable.",
  },
];

export default function FaqsPage() {
  const hero = heroForWebsiteContent("faqs", {
    eyebrow: "FAQs",
    title: "Common questions about reviewed support.",
    lead: "AMG Aviation reviews every request before acceptance. Additional information, resource review, quotes, or follow-up may be required.",
    image: IMG.generatedDispatch,
    imageAlt: "AMG dispatch and operations coordination environment",
    primary: { label: "Request Support", href: "/request-support" },
    secondary: { label: "Contact AMG Aviation", href: "/contact" },
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

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="Support Review"
            title="Clear answers before a request moves forward."
            lead="These answers summarize the review posture used across AMG Aviation website forms, portal workflows, and support conversations."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2" data-stagger-container>
            {FAQS.map((item) => (
              <article key={item.question} data-stagger-item className="oc-card h-full p-6">
                <h2 className="oc-display text-2xl text-[var(--oc-ink)]">{item.question}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Have a support question that needs review?"
        body="Send the aircraft context, timing, and requested support path so AMG can route the inquiry to the right review workflow."
        primaryLabel="Contact AMG"
        primaryHref="/contact"
        secondaryLabel="Request Support"
        secondaryHref="/request-support"
      />
    </>
  );
}
