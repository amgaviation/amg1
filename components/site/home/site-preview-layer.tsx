import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type PreviewItem = {
  n: string;
  title: string;
  description: string;
  href: string;
  highlight?: boolean;
};

const PREVIEWS: PreviewItem[] = [
  {
    n: "01",
    title: "Capabilities",
    description:
      "Review the complete support taxonomy, request sequence, and inputs AMG evaluates before a support path proceeds.",
    href: "/capabilities",
  },
  {
    n: "02",
    title: "Aircraft Supported",
    description:
      "See how aircraft category changes crew, route, airport, documentation, and operating-limit considerations.",
    href: "/aircraft-support",
  },
  {
    n: "03",
    title: "Plans",
    description:
      "Compare recurring support structures by aircraft category, support frequency, and coordination depth.",
    href: "/plans",
  },
  {
    n: "04",
    title: "Crew Network",
    description:
      "Understand how crew profiles, credentials, availability, and assignment suitability are reviewed.",
    href: "/crew-network",
  },
  {
    n: "05",
    title: "AMG Connect",
    description:
      "Learn how approved users see requests, documents, messages, quotes, invoices, and status by role.",
    href: "/amg-connect",
  },
  {
    n: "06",
    title: "Request Support",
    description:
      "Submit aircraft context, timing, support category, and constraints for review.",
    href: "/request-support",
    highlight: true,
  },
];

export function SitePreviewLayer() {
  return (
    <section className="oc-section bg-[var(--oc-ivory)]">
      <div className="oc-shell">
        <div className="mx-auto max-w-2xl text-center" data-scroll-animate>
          <p className="oc-eyebrow">Site Overview</p>
          <h2 className="oc-display mt-4 text-4xl text-[var(--oc-ink)] sm:text-5xl">
            Where do you want to start?
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--oc-muted)]">
            Start with a concise overview here, then move to the page that owns the details.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-stagger-container>
          {PREVIEWS.map((item) => (
            <Link
              key={item.n}
              href={item.href}
              prefetch={false}
              data-stagger-item
              className={`group relative flex flex-col gap-4 overflow-hidden rounded-[1.25rem] border p-7 transition-all duration-200 hover:border-[var(--oc-navy)] hover:shadow-[0_16px_48px_rgba(11,26,43,0.10)] ${
                item.highlight
                  ? "border-[var(--oc-navy)]/30 bg-[var(--oc-navy)] text-[var(--oc-paper)]"
                  : "border-[var(--oc-line)] bg-white/70"
              }`}
            >
              <span
                className={`oc-mono text-[0.65rem] ${
                  item.highlight ? "text-[var(--oc-aluminum-2)]" : "text-[var(--oc-muted)]"
                }`}
              >
                {item.n}
              </span>
              <div className="flex-1">
                <h3
                  className={`oc-display text-2xl ${
                    item.highlight ? "text-[var(--oc-paper)]" : "text-[var(--oc-ink)]"
                  }`}
                >
                  {item.title}
                </h3>
                <p
                  className={`mt-3 text-[0.88rem] leading-relaxed ${
                    item.highlight ? "text-[var(--oc-aluminum)]" : "text-[var(--oc-muted)]"
                  }`}
                >
                  {item.description}
                </p>
              </div>
              <span
                className={`oc-kicker inline-flex items-center gap-1.5 text-[0.67rem] ${
                  item.highlight ? "text-[var(--oc-blue-soft)]" : "text-[var(--oc-blue)]"
                }`}
              >
                Explore
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
