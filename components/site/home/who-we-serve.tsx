import { BadgeCheck, BriefcaseBusiness, Plane, UsersRound } from "lucide-react";

const AUDIENCES = [
  { icon: Plane, title: "Owners & Representatives", body: "Get a clear path for crew coverage, repositioning, maintenance moves, or recurring help around one aircraft." },
  { icon: BriefcaseBusiness, title: "Flight Departments", body: "Add outside coordination when crew schedules, maintenance timing, or multiple aircraft create extra workload." },
  { icon: BadgeCheck, title: "Charter Operators", body: "Coordinate approved support needs while keeping operator authority and acceptance requirements clear." },
  { icon: UsersRound, title: "Crew Members", body: "Submit credentials and availability so AMG can review fit for future assignments without exposing sensitive personal location data." },
];

export function WhoWeServe() {
  return (
    <section className="bg-[var(--oc-ivory-2)] py-14 lg:py-20">
      <div className="oc-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div>
          <p className="oc-eyebrow text-[var(--oc-blue)]">Who We Serve</p>
          <h2 className="oc-display mt-4 text-3xl text-[var(--oc-ink)] sm:text-5xl">Built for people responsible for private aircraft.</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--oc-muted)] sm:text-lg">
            AMG supports the people who need to keep an aircraft moving, covered, documented, and visible to the right stakeholders.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {AUDIENCES.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[var(--oc-line)] bg-white/82 p-6 shadow-[0_14px_42px_rgba(11,26,43,0.07)]">
              <item.icon className="h-6 w-6 text-[var(--oc-blue)]" strokeWidth={1.6} />
              <h3 className="mt-4 text-lg font-semibold text-[var(--oc-ink)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
