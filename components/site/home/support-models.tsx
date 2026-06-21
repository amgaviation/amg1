import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

const MODELS = [
  {
    name: "On-Demand Support",
    summary: "For a single crew coverage, aircraft movement, or maintenance repositioning need. Scope and pricing are confirmed for each request.",
    points: ["Request-specific scope", "Availability and feasibility review", "No recurring commitment"],
    cta: "View On-Demand Support",
  },
  {
    name: "Recurring Owner Support",
    summary: "For an owner who needs ongoing support around one aircraft under a defined monthly scope.",
    points: ["Defined monthly support scope", "Priority review process", "Consistent owner communication"],
    cta: "View Recurring Support",
    featured: true,
  },
  {
    name: "Fleet / Department Support",
    summary: "For owners and flight departments managing multiple aircraft or variable crew requirements.",
    points: ["Multi-aircraft coordination", "Role-based portal visibility", "Custom support structure"],
    cta: "View Department Support",
  },
];

export function SupportModels() {
  return (
    <section className="bg-[#0a0a0a] py-24 lg:py-32">
      <div className="oc-shell">
        {/* Header row */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/30">
              Support Options
            </p>
            <h2 className="text-balance text-4xl font-bold leading-[0.9] tracking-tight text-white sm:text-5xl">
              Choose the support structure that fits the operation.
            </h2>
            <p className="mt-4 text-[0.9rem] leading-relaxed text-white/45">
              Use AMG for one request, recurring support for one aircraft, or a custom structure for a flight department.
            </p>
          </div>
          <Link
            href="/plans"
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.1] px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-widest text-white/50 transition-all duration-200 hover:border-white/[0.2] hover:text-white/90"
          >
            Compare Support Options
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Plan cards */}
        <div className="mt-10 grid gap-3 lg:grid-cols-3" data-stagger-container>
          {MODELS.map((m) => (
            <article
              key={m.name}
              data-stagger-item
              className={`group flex h-full flex-col rounded-xl border p-7 lg:p-8 transition-colors duration-200 ${
                m.featured
                  ? "border-white/[0.14] bg-[#111111] hover:bg-[#161616]"
                  : "border-white/[0.06] bg-[#0a0a0a] hover:border-white/[0.1] hover:bg-[#111111]"
              }`}
            >
              {m.featured && (
                <span className="mb-4 inline-flex self-start rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-widest text-white/50">
                  Popular
                </span>
              )}
              <h3 className="text-xl font-bold tracking-tight text-white">{m.name}</h3>
              <p className="mt-3 text-[0.85rem] leading-relaxed text-white/45">{m.summary}</p>
              <ul className="mt-6 grid gap-2.5">
                {m.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[0.82rem] text-white/60">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/plans"
                prefetch={false}
                className="mt-auto inline-flex items-center gap-2 pt-7 text-[0.65rem] font-semibold uppercase tracking-widest text-white/30 transition-colors duration-200 group-hover:text-white/70"
              >
                {m.cta}
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>

        {/* Pricing note */}
        <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#000000] p-6 lg:p-8">
          <h3 className="text-[0.92rem] font-semibold text-white">How pricing works</h3>
          <p className="mt-2 max-w-4xl text-[0.8rem] leading-relaxed text-white/40">
            On-demand work is scoped for the individual request. Recurring owner support uses a defined monthly structure. Fleet and flight-department support is configured around aircraft count, frequency, and support scope. Final pricing is confirmed after AMG reviews the operating details.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-widest text-black transition-all duration-200 hover:bg-white/85 hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
            >
              Compare Support Options
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-widest text-white/50 transition-all duration-200 hover:border-white/[0.2] hover:text-white/90"
            >
              Speak With AMG
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
