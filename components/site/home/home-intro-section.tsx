import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const OFFERS = [
  {
    label: "Crew Coverage",
    body: "Aircraft-fit crew review, credentials, location, availability, and timing.",
  },
  {
    label: "Aircraft Movement",
    body: "Repositioning and ferry support coordination for approved operating needs.",
  },
  {
    label: "Maintenance Repositioning",
    body: "Crew, timing, documents, and aircraft movement around maintenance events.",
  },
  {
    label: "Recurring Support",
    body: "Defined support structures for one aircraft, multiple aircraft, or flight departments.",
  },
];

export function HomeIntroSection() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden border-b border-[var(--oc-line-dark)] bg-[#050B14] px-0 pb-14 pt-[calc(var(--public-header-height)+3rem)] text-white sm:pb-16 lg:min-h-[calc(100svh-var(--public-header-height))] lg:pb-20 lg:pt-[calc(var(--public-header-height)+4.5rem)]"
      aria-labelledby="home-intro-title"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(5,11,20,1)_54%,rgba(7,17,31,0.94)_100%)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:linear-gradient(90deg,rgba(192,199,209,0.055)_1px,transparent_1px),linear-gradient(180deg,rgba(192,199,209,0.04)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(180deg,black,transparent_76%)]" aria-hidden="true" />

      <div className="oc-shell">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-end">
          <div className="max-w-5xl">
            <p className="oc-eyebrow text-[var(--oc-blue-soft)]">Private Aircraft Support</p>
            <h1
              id="home-intro-title"
              className="oc-display mt-5 max-w-6xl text-[clamp(2.45rem,7vw,5.85rem)] leading-[0.98] text-white"
            >
              Crew, aircraft movement, maintenance repositioning, and recurring support.{" "}
              <span className="block text-[var(--oc-aluminum)]">Coordinated by AMG.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-[clamp(1rem,2vw,1.22rem)] leading-relaxed text-[var(--oc-aluminum)]">
              AMG helps owners, representatives, and flight departments review aircraft support needs,
              coordinate qualified resources, and keep communication clear from request to completion.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-light justify-center">
                Request aircraft support
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/capabilities" prefetch={false} className="oc-btn oc-btn-ghost-dark justify-center">
                Services
              </Link>
            </div>
          </div>

          <aside className="border-l border-[var(--oc-line-dark)] pl-5 text-sm leading-relaxed text-[var(--oc-aluminum)] lg:pl-7">
            <p className="oc-kicker text-[var(--oc-blue-soft)]">In one sentence</p>
            <p className="mt-3 text-lg font-semibold leading-snug text-white">
              AMG coordinates the people, timing, and operational details that keep private aircraft support moving clearly.
            </p>
          </aside>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
          {OFFERS.map((offer, index) => (
            <article
              key={offer.label}
              className="min-h-40 rounded-lg border border-[var(--oc-line-dark)] bg-white/[0.045] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.16)]"
            >
              <p className="oc-mono text-[0.68rem] text-[var(--oc-blue-soft)]">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-4 text-lg font-semibold leading-tight text-white">{offer.label}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--oc-aluminum)]">{offer.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
