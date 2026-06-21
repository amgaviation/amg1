import { ClipboardCheck, FileText, MessageSquare, SearchCheck } from "lucide-react";

const STEPS = [
  { icon: FileText, title: "Send the operating details", body: "Provide the aircraft, location, timing, requested support, and known constraints." },
  { icon: SearchCheck, title: "AMG reviews feasibility", body: "AMG reviews scope, aircraft status, crew availability, approvals, and relevant route or airport factors." },
  { icon: ClipboardCheck, title: "Receive a defined next step", body: "AMG confirms what can proceed and provides the applicable scope, requirements, quote, or plan review." },
  { icon: MessageSquare, title: "Coordinate and track", body: "Approved users can follow messages, documents, quotes, invoices, and status in AMG Connect." },
];

export function OperationalTrustStrip() {
  return (
    <section className="border-t border-white/[0.06] bg-[#000000] py-24 lg:py-32">
      <div className="oc-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/30">
            How it works
          </p>
          <h2 className="text-balance text-4xl font-bold leading-[0.9] tracking-tight text-white sm:text-5xl">
            From a support request to a clear next step.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger-container>
          {STEPS.map((item, index) => (
            <article
              key={item.title}
              data-stagger-item
              className="group relative flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-6 transition-colors duration-200 hover:border-white/[0.1] hover:bg-[#111111]"
            >
              {/* Step number */}
              <span className="absolute right-5 top-5 font-mono text-[0.58rem] tabular-nums text-white/15">
                0{index + 1}
              </span>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                <item.icon className="h-5 w-5 text-white/50" strokeWidth={1.5} />
              </div>

              <h3 className="text-[0.92rem] font-semibold leading-snug text-white">{item.title}</h3>
              <p className="text-[0.8rem] leading-relaxed text-white/40">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
