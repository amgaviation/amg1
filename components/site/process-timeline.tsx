import Image from "next/image";
import { HOW_AMG_WORKS } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function ProcessTimeline() {
  return (
    <section className="cinematic-section relative isolate overflow-hidden border-y border-slate-950/20 bg-[var(--amg-ink)] py-24 text-white lg:py-28">
      <div className="absolute inset-0 opacity-[0.24]" aria-hidden="true">
        <Image src="/images/flightdeck/runway-dusk.webp" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,11,20,0.98)_0%,rgba(5,11,20,0.92)_48%,rgba(5,11,20,0.74)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(59,130,246,0.18),transparent_28rem)]" />
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-10">
        <Reveal className="lg:sticky lg:top-28 lg:self-start" data-scroll-animate>
          <p className="eyebrow mb-5 inline-flex items-center gap-3 text-[var(--amg-light-gray)]">
            <span className="h-px w-10 bg-primary/80" />
            How AMG Works
          </p>
          <h2 className="display-heading text-balance text-5xl text-white sm:text-6xl lg:text-7xl">
            Request. Review. Coordinate. Support.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Each support path is reviewed before acceptance so responsibility,
            readiness, and operating authority stay clear.
          </p>
        </Reveal>

        <RevealGroup className="relative grid gap-5" data-process-track>
          <div
            className="section-progress-rail absolute left-[2.15rem] top-8 hidden h-[calc(100%-4rem)] w-px bg-white/[0.12] md:block"
            aria-hidden="true"
          >
            <span className="section-progress-line" data-progress-rail />
          </div>
          {HOW_AMG_WORKS.map((item) => (
            <RevealItem key={item.step}>
              <article className="process-card grid gap-6 rounded-lg border border-white/[0.12] bg-white/[0.07] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur md:grid-cols-[110px_1fr] lg:p-10" data-process-step>
                <p className="relative z-10 font-display text-6xl font-extrabold leading-none text-primary/80" data-step-marker>
                  {item.step}
                </p>
                <div>
                  <h3 className="font-display text-3xl font-extrabold uppercase text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">
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
