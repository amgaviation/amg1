import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getServiceImage } from "@/lib/site-media";

const SERVICES = [
  {
    n: "01",
    title: "Hire Pilots",
    body: "Find pilot and crew coverage matched to the aircraft, airport, dates, credentials, and owner approval needed for the trip.",
    href: "/crew-network",
    cta: "Explore Crew Coverage",
    image: getServiceImage("contract-pilot-support"),
    alt: "Pilot reviewing flight documents before a private aircraft assignment",
  },
  {
    n: "02",
    title: "Move Your Aircraft",
    body: "Arrange ferry, repositioning, or other approved non-passenger aircraft movement with the right crew and trip details in place.",
    href: "/capabilities#what-amg-supports",
    cta: "Explore Aircraft Movement",
    image: getServiceImage("ferry-repositioning"),
    alt: "Business aircraft positioned on a private aviation ramp",
  },
  {
    n: "03",
    title: "Maintenance Moves",
    body: "Coordinate crew, timing, documents, and handoffs when an aircraft needs to move to or from a maintenance facility.",
    href: "/aircraft-support",
    cta: "Explore Maintenance Moves",
    image: getServiceImage("maintenance-flight-support"),
    alt: "Maintenance support planning around a private aircraft",
  },
  {
    n: "04",
    title: "Ongoing Operations",
    body: "Set up recurring help for one aircraft, multiple aircraft, or changing crew requirements without turning the portal into the product.",
    href: "/plans",
    cta: "Compare Plans",
    image: getServiceImage("fleet-support-programs"),
    alt: "Private aviation operations team coordinating aircraft support",
  },
];

export function SitePreviewLayer() {
  return (
    <section className="bg-[var(--oc-ivory)] py-14 lg:py-20">
      <div className="oc-shell">
        <div className="max-w-2xl" data-scroll-animate>
          <p className="oc-eyebrow text-[var(--oc-blue)]">What We Do</p>
          <h2 className="oc-display mt-4 text-3xl text-[var(--oc-ink)] sm:text-5xl">Private jet services when the aircraft needs people, movement, or a plan.</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--oc-muted)] sm:text-lg">
            Start with the aircraft type, airport, timing, and goal. AMG helps organize the next step without promising availability before the details are checked.
          </p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
          {SERVICES.map((item) => (
            <Link key={item.n} href={item.href} prefetch={false} data-stagger-item className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-[var(--oc-line)] bg-white shadow-[0_16px_44px_rgba(11,26,43,0.08)] transition hover:border-[var(--oc-navy)] hover:shadow-[0_18px_54px_rgba(11,26,43,0.14)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--oc-graphite)]">
                <Image src={item.image} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050B14]/58 to-transparent" />
                <span className="oc-mono absolute bottom-3 left-4 text-[0.65rem] text-white/82">{item.n}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="oc-display text-2xl text-[var(--oc-ink)]">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--oc-muted)]">{item.body}</p>
                <span className="oc-kicker mt-6 inline-flex items-center gap-1.5 text-[0.67rem] text-[var(--oc-blue)]">{item.cta}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
