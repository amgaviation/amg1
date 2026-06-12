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
    <section className="border-y border-border bg-card/30 py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-y-12 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="text-center"
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
