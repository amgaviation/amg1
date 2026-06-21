import { Eye, GitBranch, SearchCheck, SlidersHorizontal } from "lucide-react";

const REASONS = [
  { icon: GitBranch, title: "One coordinated workflow", body: "Requests, messages, documents, quotes, invoices, and status can be managed through AMG Connect." },
  { icon: SearchCheck, title: "Feasibility before acceptance", body: "AMG reviews the aircraft, timing, crew availability, approvals, and operating constraints before confirming support." },
  { icon: Eye, title: "Visibility by role", body: "Owners, crew members, approved partners, and administrators see information relevant to their role." },
  { icon: SlidersHorizontal, title: "Flexible engagement", body: "Use AMG for a single request, recurring support for one aircraft, or a custom flight-department structure." },
];

export function WhyAmg() {
  return (
    <section id="why-amg" className="public-editorial-section public-why-section" aria-labelledby="why-amg-heading">
      <div className="oc-shell">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">Why AMG</p>
          <h2 id="why-amg-heading" className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl lg:text-[5.2rem]">
            A clearer operating picture before support is accepted.
          </h2>
        </div>
        <div className="public-wake-grid mt-12 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <article key={reason.title} className="public-why-column">
              <reason.icon className="h-6 w-6 text-[var(--oc-blue)]" strokeWidth={1.6} />
              <h3>{reason.title}</h3>
              <p>{reason.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
