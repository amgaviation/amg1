import { AIRCRAFT_CATEGORIES } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function AircraftCategoryShowcase() {
  return (
    <section className="py-28 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-5 text-accent">Aircraft Categories</p>
          <h2 className="display-heading text-balance text-5xl text-foreground sm:text-6xl lg:text-7xl">
            Reviewed by aircraft, not assumptions.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            AMG reviews each aircraft support request according to crew requirements,
            aircraft status, route, mission complexity, airport limitations, operating
            conditions, and owner/operator approval.
          </p>
        </Reveal>

        <RevealGroup className="grid gap-5">
          {AIRCRAFT_CATEGORIES.map((aircraft) => (
            <RevealItem key={aircraft.id}>
              <article className="hover-lift group overflow-hidden rounded-xl border border-border bg-card hover:border-accent/50">
                <div className="grid md:grid-cols-[0.45fr_0.55fr]">
                  <div className="relative min-h-64 overflow-hidden bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(7,17,31,0.98)_48%,rgba(56,189,248,0.1))] p-6">
                    <div className="absolute inset-x-6 top-6 h-px bg-accent/30" />
                    <div className="absolute bottom-6 right-6 h-24 w-24 rounded-full border border-accent/20" />
                    <p className="font-display text-5xl font-extrabold uppercase leading-none text-accent/25">
                      {aircraft.category}
                    </p>
                  </div>
                  <div className="p-7">
                    <p className="eyebrow text-[0.65rem] text-accent">{aircraft.category}</p>
                    <h3 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none tracking-wide text-foreground">
                      {aircraft.name}
                    </h3>
                    <p className="mt-5 leading-relaxed text-muted-foreground">
                      {aircraft.support}
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      {aircraft.factors.map((factor) => (
                        <span
                          key={factor}
                          className="rounded-full border border-border px-3 py-2 text-xs text-foreground/75"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
