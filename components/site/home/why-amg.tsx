import { Eye, GitBranch, SearchCheck, SlidersHorizontal } from "lucide-react";

const REASONS = [
  { icon: GitBranch, title: "One coordinated workflow", body: "Requests, messages, documents, quotes, invoices, and status can be managed through AMG Connect." },
  { icon: SearchCheck, title: "Feasibility before acceptance", body: "AMG reviews the aircraft, timing, crew availability, approvals, and operating constraints before confirming support." },
  { icon: Eye, title: "Visibility by role", body: "Owners, crew members, approved partners, and administrators see information relevant to their role." },
  { icon: SlidersHorizontal, title: "Flexible engagement", body: "Use AMG for a single request, recurring support for one aircraft, or a custom flight-department structure." },
];

export function WhyAmg() {
  return (
    <section className="oc-section bg-[var(--oc-ivory-2)]">
      <div className="oc-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="oc-eyebrow text-[var(--oc-blue)]">Why AMG</p>
          <h2 className="oc-display mt-4 text-3xl text-[var(--oc-ink)] sm:text-5xl">A clearer operating picture before support is accepted.</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <article key={reason.title} className="rounded-xl border border-[var(--oc-line)] bg-white/75 p-6">
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
