import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const AUDIENCE_CARDS = [
  {
    label: "Aircraft Owners & Operators",
    headline: "Visibility into what is moving, what is pending, and who is involved.",
    body: "For owners and operators who need structured support around aircraft movement, maintenance timing, crew coordination, and a clearer view of request status and operating context.",
    cta: { label: "Request support", href: "/booking-request", primary: true },
    secondary: { label: "View Plans", href: "/plans" },
  },
  {
    label: "Flight Departments",
    headline: "Practical support around crew coordination, aircraft movement, and recurring operational needs.",
    body: "For teams managing ongoing coordination, multiple support events, or recurring crew and logistics needs across an aircraft or small fleet.",
    cta: { label: "Explore Capabilities", href: "/capabilities", primary: true },
    secondary: { label: "View Plans", href: "/plans" },
  },
  {
    label: "Crew",
    headline: "Clearer assignment context, credential organization, and availability visibility.",
    body: "For pilots and crew who need a structured way to manage availability, credentials, aircraft type context, and communication with AMG Operations.",
    cta: { label: "View Crew Network", href: "/crew-network", primary: true },
    secondary: { label: "Member login", href: "/login" },
  },
] as const;

export function ClientCrewAttentionSection() {
  return (
    <section className="oc-panel-navy oc-section relative overflow-hidden text-[var(--oc-paper)]">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:80px_80px]" />

      <div className="oc-shell relative z-10">
        <div className="max-w-2xl" data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">Who AMG Supports</p>
          <h2 className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl">
            Built for the people responsible for the operation.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3" data-stagger-container>
          {AUDIENCE_CARDS.map((card) => (
            <article
              key={card.label}
              data-stagger-item
              className="oc-card-dark flex flex-col gap-5 p-7 lg:p-8"
            >
              <div>
                <p className="oc-kicker text-[0.62rem] text-[var(--oc-aluminum-2)]">{card.label}</p>
                <h3 className="oc-display mt-3 text-[1.35rem] leading-tight text-[var(--oc-paper)] sm:text-2xl">
                  {card.headline}
                </h3>
                <p className="mt-4 text-[0.88rem] leading-relaxed text-[var(--oc-aluminum)]">{card.body}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-2">
                <Link href={card.cta.href} prefetch={false} className="oc-btn oc-btn-light text-xs">
                  {card.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={card.secondary.href}
                  prefetch={false}
                  className="oc-kicker inline-flex min-h-11 items-center gap-1.5 text-[0.62rem] text-[var(--oc-blue-soft)] transition-colors hover:text-[var(--oc-aluminum)]"
                >
                  {card.secondary.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3" data-scroll-animate>
          <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-light">
            Request support
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/crew-network" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            View Crew Network
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href="/login" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            Member login
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
