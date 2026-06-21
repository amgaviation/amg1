import { ClipboardCheck, FileText, MessageSquare, SearchCheck } from "lucide-react";

const STEPS = [
  { icon: FileText, title: "Send the aircraft details", body: "Share the aircraft type, current airport, destination or goal, timing, crew need, and known limits." },
  { icon: SearchCheck, title: "AMG checks the request", body: "The team looks at aircraft readiness, crew fit, approvals, airports, route factors, weather, and schedule." },
  { icon: ClipboardCheck, title: "You get a clear next step", body: "AMG explains what can move forward and provides the scope, quote, requirements, or plan review that applies." },
  { icon: MessageSquare, title: "Approved users can track it", body: "AMG Connect keeps messages, documents, quotes, invoices, and status in one place for the right roles." },
];

export function OperationalTrustStrip() {
  return (
    <section className="border-b border-[var(--oc-line)] bg-[var(--oc-ivory)] py-14 lg:py-20">
      <div className="oc-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="oc-eyebrow text-[var(--oc-blue)]">How It Works</p>
          <h2 className="oc-display mt-3 text-3xl text-[var(--oc-ink)] sm:text-5xl">From request to a yes, no, or better next step.</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--oc-muted)] sm:text-lg">A request starts a review. It is not a booking, dispatch, reservation, or guarantee.</p>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
          {STEPS.map((item, index) => (
            <article key={item.title} data-stagger-item className="flex h-full flex-col gap-3 rounded-xl border border-[var(--oc-line)] bg-white/82 p-6 shadow-[0_14px_40px_rgba(11,26,43,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--oc-navy)]/6 text-[var(--oc-navy)]"><item.icon className="h-5 w-5" strokeWidth={1.5} /></div>
                <span className="oc-mono text-xs text-[var(--oc-muted)]">0{index + 1}</span>
              </div>
              <h3 className="text-base font-semibold text-[var(--oc-ink)]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--oc-muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
