import { Eye, GitBranch, SearchCheck, SlidersHorizontal } from "lucide-react";

const REASONS = [
  { icon: GitBranch, title: "People and paperwork in one workflow", body: "Requests, messages, documents, quotes, invoices, and status can live in AMG Connect instead of scattered email threads." },
  { icon: SearchCheck, title: "Details checked before acceptance", body: "Crew fit, aircraft readiness, approvals, airports, weather, and timing are checked before AMG confirms what can proceed." },
  { icon: Eye, title: "Role-based visibility", body: "Owners, crew members, approved partners, and administrators see the information meant for their role." },
  { icon: SlidersHorizontal, title: "Flexible ways to engage", body: "Start with a single job, monthly help around one aircraft, or a custom plan for a flight department." },
];

export function WhyAmg() {
  return (
    <section className="bg-[var(--oc-ivory-2)] py-14 lg:py-20">
      <div className="oc-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="oc-eyebrow text-[var(--oc-blue)]">Why Choose AMG</p>
          <h2 className="oc-display mt-4 text-3xl text-[var(--oc-ink)] sm:text-5xl">Less guesswork before you move the aircraft.</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--oc-muted)] sm:text-lg">AMG gives owners and flight departments a cleaner path from “we need help” to a specific next step.</p>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <article key={reason.title} className="rounded-xl border border-[var(--oc-line)] bg-white/82 p-6 shadow-[0_14px_42px_rgba(11,26,43,0.06)]">
              <reason.icon className="h-6 w-6 text-[var(--oc-blue)]" strokeWidth={1.6} />
              <h3 className="mt-4 text-base font-semibold text-[var(--oc-ink)]">{reason.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">{reason.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
