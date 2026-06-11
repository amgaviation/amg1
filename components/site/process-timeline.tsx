import { HOW_AMG_WORKS } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function ProcessTimeline() {
  return (
    <section className="cinematic-section border-y border-border bg-card/25 py-28">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-10">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-5 text-accent">How AMG Works</p>
          <h2 className="display-heading text-balance text-5xl text-foreground sm:text-6xl lg:text-7xl">
            Request. Review. Coordinate. Support.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Each support path is reviewed before acceptance so responsibility,
            readiness, and operating authority stay clear.
          </p>
        </Reveal>

        <RevealGroup className="grid gap-px overflow-hidden rounded-xl border border-border bg-border">
          {HOW_AMG_WORKS.map((item) => (
            <RevealItem key={item.step}>
              <article className="grid gap-6 bg-card p-7 md:grid-cols-[110px_1fr] lg:p-10">
                <p className="font-display text-6xl font-extrabold leading-none text-accent/45">
                  {item.step}
                </p>
                <div>
                  <h3 className="font-display text-3xl font-extrabold uppercase tracking-wide text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
