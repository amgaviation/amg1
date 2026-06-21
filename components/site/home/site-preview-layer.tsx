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
    <section className="bg-[#0a0a0a] py-24 lg:py-32">
      <div className="oc-shell">
        <div className="mx-auto max-w-2xl text-center" data-scroll-animate>
          <p className="mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/30">
            What AMG coordinates
          </p>
          <h2 className="text-balance text-4xl font-bold leading-[0.9] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
            Support built around the aircraft and the operating need.
          </h2>
        </div>

        <div className="mt-12 grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
          {SERVICES.map((item) => (
            <Link
              key={item.n}
              href={item.href}
              prefetch={false}
              data-stagger-item
              className="group flex h-full flex-col bg-[#0a0a0a] p-7 transition-colors duration-200 hover:bg-[#111111]"
            >
              <span className="font-mono text-[0.6rem] tabular-nums text-white/20">{item.n}</span>
              <h3 className="mt-5 text-xl font-bold tracking-tight text-white">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/45">{item.body}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-white/30 transition-colors duration-200 group-hover:text-white/70">
                {item.cta}
                <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
