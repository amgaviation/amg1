import { ClipboardCheck, FileText, MessageSquare, SearchCheck } from "lucide-react";

const STEPS = [
  { icon: FileText, title: "Send the operating details", body: "Provide the aircraft, location, timing, requested support, and known constraints." },
  { icon: SearchCheck, title: "AMG reviews feasibility", body: "AMG reviews scope, aircraft status, crew availability, approvals, and relevant route or airport factors." },
  { icon: ClipboardCheck, title: "Receive a defined next step", body: "AMG confirms what can proceed and provides the applicable scope, requirements, quote, or plan review." },
  { icon: MessageSquare, title: "Coordinate and track", body: "Approved users can follow messages, documents, quotes, invoices, and status in AMG Connect." },
];

export function OperationalTrustStrip() {
  return (
    <section id="request-process" className="public-editorial-section public-process-section" aria-labelledby="request-process-heading">
      <div className="oc-shell">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">How it works</p>
          <h2 id="request-process-heading" className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl lg:text-[5.4rem]">
            From operating details to a defined next step.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
            The request path is linear, but acceptance is not automatic. AMG reviews the aircraft, scope, approvals, and operating conditions before confirming what can proceed.
          </p>
        </div>
        <div className="public-route-line" aria-hidden="true" />
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
          {STEPS.map((item, index) => (
            <li key={item.title} data-stagger-item className="public-process-step">
              <div className="public-process-step__icon">
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="public-process-step__number">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
