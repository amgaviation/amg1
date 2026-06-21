import { Eye, GitBranch, SearchCheck, SlidersHorizontal } from "lucide-react";

const REASONS = [
  { icon: GitBranch, title: "One coordinated workflow", body: "Requests, messages, documents, quotes, invoices, and status can be managed through AMG Connect." },
  { icon: SearchCheck, title: "Feasibility before acceptance", body: "AMG reviews the aircraft, timing, crew availability, approvals, and operating constraints before confirming support." },
  { icon: Eye, title: "Visibility by role", body: "Owners, crew members, approved partners, and administrators see information relevant to their role." },
  { icon: SlidersHorizontal, title: "Flexible engagement", body: "Use AMG for a single request, recurring support for one aircraft, or a custom flight-department structure." },
];

export function WhyAmg() {
  return (
    <section className="border-t border-white/[0.06] bg-[#000000] py-24 lg:py-32">
      <div className="oc-shell">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/30">
            Why AMG
          </p>
          <h2 className="text-balance text-4xl font-bold leading-[0.9] tracking-tight text-white sm:text-5xl">
            A clearer operating picture before support is accepted.
          </h2>
        </div>

        {/* Reason cards */}
        <div className="mt-12 grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <article
              key={reason.title}
              className="flex flex-col gap-4 bg-[#000000] p-7 transition-colors duration-200 hover:bg-[#0a0a0a]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <reason.icon className="h-5 w-5 text-white/50" strokeWidth={1.6} />
              </div>
              <h3 className="text-[0.92rem] font-semibold leading-snug text-white">{reason.title}</h3>
              <p className="text-[0.8rem] leading-relaxed text-white/40">{reason.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
