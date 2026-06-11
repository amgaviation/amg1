import { DESTINATIONS } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function DestinationsSection() {
  return (
    <section className="relative overflow-hidden border-y border-border py-28">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/jet-sky.png" alt="" className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <Reveal>
          <p className="eyebrow mb-5 text-accent">Global Ready</p>
          <h2 className="display-heading text-balance text-5xl text-foreground sm:text-6xl lg:text-7xl">
            Anywhere the mission moves
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            AMG coordinates owner missions, crew movement, aircraft support, and operational records across domestic and international itineraries.
          </p>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          {DESTINATIONS.map((city) => (
            <RevealItem key={city}>
              <div className="bg-card/90 p-5 font-display text-xl font-bold uppercase tracking-wide text-foreground transition-colors hover:bg-secondary hover:text-accent">
                {city}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
