import { STATS } from "@/lib/content";

function Counter({
  target,
  suffix,
}: {
  target: number;
  suffix: string;
}) {
  return (
    <span>
      {target.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="cinematic-band border-y border-slate-200 bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-scroll-animate>
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-[0_16px_44px_rgba(8,20,36,0.07)]"
            >
              <div className="font-display text-5xl font-extrabold text-foreground lg:text-6xl">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="eyebrow mt-3 text-[0.7rem] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
