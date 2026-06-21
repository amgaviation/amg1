import { ClipboardCheck, FileText, MessageSquare, SearchCheck } from "lucide-react";

const STEPS = [
  { icon: FileText, title: "Send the operating details", body: "Provide the aircraft, location, timing, requested support, and known constraints." },
  { icon: SearchCheck, title: "AMG reviews feasibility", body: "AMG reviews scope, aircraft status, crew availability, approvals, and relevant route or airport factors." },
  { icon: ClipboardCheck, title: "Receive a defined next step", body: "AMG confirms what can proceed and provides the applicable scope, requirements, quote, or plan review." },
  { icon: MessageSquare, title: "Coordinate and track", body: "Approved users can follow messages, documents, quotes, invoices, and status in AMG Connect." },
];

export function OperationalTrustStrip() {
  return (
    <section className="border-b border-[var(--oc-line)] bg-[var(--oc-ivory)]">
      <div className="oc-shell py-12 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="oc-eyebrow text-[var(--oc-blue)]">How it works</p>
          <h2 className="oc-display mt-3 text-3xl text-[var(--oc-ink)] sm:text-5xl">From a support request to a clear next step.</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
          {STEPS.map((item, index) => (
            <article key={item.title} data-stagger-item className="flex h-full flex-col gap-3 rounded-xl border border-[var(--oc-line)] bg-white/78 p-6 shadow-[0_14px_40px_rgba(11,26,43,0.06)]">
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
