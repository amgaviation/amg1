import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const SERVICES = [
  { n: "01", title: "Crew Coverage", body: "AMG reviews location, aircraft experience, credentials, availability, and assignment fit before presenting a crew option.", href: "/crew-network", cta: "Explore Crew Coverage" },
  { n: "02", title: "Aircraft Movement", body: "Coordinate support requirements for repositioning and other approved aircraft movement needs.", href: "/capabilities#what-amg-supports", cta: "Explore Aircraft Movement" },
  { n: "03", title: "Maintenance Repositioning", body: "Coordinate the aircraft, crew, timing, and documentation requirements surrounding a maintenance-related repositioning.", href: "/aircraft-support", cta: "Explore Maintenance Support" },
  { n: "04", title: "Recurring Support", body: "Use a defined support structure for one aircraft, multiple aircraft, or changing crew requirements.", href: "/plans", cta: "Compare Support Options" },
];

export function SitePreviewLayer() {
  return (
    <section id="capabilities" className="bg-[var(--oc-ivory)] py-14 lg:py-20">
      <div className="oc-shell">
        <div className="mx-auto max-w-2xl text-center" data-scroll-animate>
          <p className="oc-eyebrow text-[var(--oc-blue)]">What AMG coordinates</p>
          <h2 className="oc-display mt-4 text-3xl text-[var(--oc-ink)] sm:text-5xl">Support built around the aircraft and the operating need.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
          {SERVICES.map((item) => (
            <Link key={item.n} href={item.href} prefetch={false} data-stagger-item className="group flex h-full flex-col rounded-[1.25rem] border border-[var(--oc-line)] bg-white/75 p-6 transition hover:border-[var(--oc-navy)] hover:shadow-[0_16px_48px_rgba(11,26,43,0.10)]">
              <span className="oc-mono text-[0.65rem] text-[var(--oc-muted)]">{item.n}</span>
              <h3 className="oc-display mt-4 text-2xl text-[var(--oc-ink)]">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--oc-muted)]">{item.body}</p>
              <span className="oc-kicker mt-6 inline-flex items-center gap-1.5 text-[0.67rem] text-[var(--oc-blue)]">{item.cta}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
