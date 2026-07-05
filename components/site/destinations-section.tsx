import Image from "next/image";
import { DESTINATIONS } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function DestinationsSection() {
  return (
    <section className="cinematic-band relative overflow-hidden border-y border-white/[0.10] py-28">
      <div className="absolute inset-0 -z-10 opacity-20" aria-hidden="true">
        <Image src="/images/flightdeck/stratosphere.webp" alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <Reveal data-scroll-animate>
          <p className="eyebrow mb-5 text-accent">Global Ready</p>
          <h2 className="display-heading text-balance text-5xl text-foreground sm:text-6xl lg:text-7xl">
            Anywhere the mission moves
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            AMG coordinates owner missions, crew movement, aircraft support, and operational records across domestic and international itineraries.
          </p>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-scroll-animate>
          {DESTINATIONS.map((city) => (
            <RevealItem key={city}>
              <div className="glass-panel rounded-lg p-5 font-display text-xl font-bold uppercase tracking-wide text-foreground transition-colors hover:text-accent">
                {city}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
