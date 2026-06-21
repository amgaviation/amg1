import { BadgeCheck, BriefcaseBusiness, Plane, UsersRound } from "lucide-react";

const AUDIENCES = [
  { icon: Plane, title: "Owners & Representatives", body: "Get a clear path for crew coverage, repositioning, maintenance moves, or recurring help around one aircraft." },
  { icon: BriefcaseBusiness, title: "Flight Departments", body: "Add outside coordination when crew schedules, maintenance timing, or multiple aircraft create extra workload." },
  { icon: BadgeCheck, title: "Charter Operators", body: "Coordinate approved support needs while keeping operator authority and acceptance requirements clear." },
  { icon: UsersRound, title: "Crew Members", body: "Submit credentials and availability so AMG can review fit for future assignments without exposing sensitive personal location data." },
];

export function WhoWeServe() {
  return (
    <section className="bg-[#0a0a0a] py-24 lg:py-32">
      <div className="oc-shell grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        {/* Left column — heading */}
        <div>
          <p className="mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/30">
            Who We Serve
          </p>
          <h2 className="text-balance text-4xl font-bold leading-[0.9] tracking-tight text-white sm:text-5xl">
            Built for people responsible for private aircraft.
          </h2>
          <p className="mt-5 text-[0.9rem] leading-relaxed text-white/45">
            AMG supports the people who need to keep an aircraft moving, covered, documented, and visible to the right stakeholders.
          </p>
        </div>

        {/* Right column — audience cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {AUDIENCES.map((item) => (
            <article
              key={item.title}
              className="group flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-[#000000] p-6 transition-colors duration-200 hover:border-white/[0.1] hover:bg-[#111111]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <item.icon className="h-5 w-5 text-white/50" strokeWidth={1.6} />
              </div>
              <h3 className="text-[0.95rem] font-semibold leading-snug text-white">{item.title}</h3>
              <p className="text-[0.8rem] leading-relaxed text-white/40">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
