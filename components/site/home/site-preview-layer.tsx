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
    <section id="services" className="public-editorial-section public-services-section" aria-labelledby="services-heading">
      <div className="oc-shell">
        <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
          <div className="lg:sticky lg:top-[calc(var(--public-header-height)+3rem)]" data-scroll-animate>
            <p className="oc-eyebrow oc-eyebrow-light">What AMG coordinates</p>
            <h2 id="services-heading" className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl lg:text-[4.8rem]">
              Support built around the aircraft and the operating need.
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--oc-aluminum)]">
              Four public service paths, one review-led operating posture. Each path keeps authority, availability, and acceptance conditions explicit.
            </p>
          </div>
          <div className="public-service-list" data-stagger-container>
            {SERVICES.map((item) => (
              <Link key={item.n} href={item.href} prefetch={false} data-stagger-item className="public-service-row group">
                <span className="public-service-row__number">{item.n}</span>
                <span className="public-service-row__main">
                  <span className="public-service-row__title">{item.title}</span>
                  <span className="public-service-row__body">{item.body}</span>
                </span>
                <span className="public-service-row__cta">
                  {item.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
