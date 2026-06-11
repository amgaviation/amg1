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
                  <div className="relative min-h-64 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={aircraft.image}
                      alt={`${aircraft.name} support category`}
                      className="h-full w-full object-cover opacity-75 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
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
