import { HOW_AMG_WORKS } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function ProcessTimeline() {
  return (
    <section className="cinematic-section relative isolate overflow-hidden border-y border-slate-200 bg-white py-24 lg:py-28">
      <div className="absolute inset-y-0 left-0 hidden w-[42vw] opacity-12 lg:block" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/site/map-operations.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/78 to-transparent" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-10">
        <Reveal className="lg:sticky lg:top-28 lg:self-start" data-scroll-animate>
          <p className="eyebrow mb-5 text-accent">How AMG Works</p>
          <h2 className="display-heading text-balance text-5xl text-slate-950 sm:text-6xl lg:text-7xl">
            Request. Review. Coordinate. Support.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Each support path is reviewed before acceptance so responsibility,
            readiness, and operating authority stay clear.
          </p>
        </Reveal>

        <RevealGroup className="relative grid gap-5" data-process-track>
          <div
            className="section-progress-rail absolute left-[2.15rem] top-8 hidden h-[calc(100%-4rem)] w-px bg-slate-200 md:block"
            aria-hidden="true"
          >
            <span className="section-progress-line" data-progress-rail />
          </div>
          {HOW_AMG_WORKS.map((item) => (
            <RevealItem key={item.step}>
              <article className="process-card grid gap-6 rounded-lg border border-slate-200 bg-slate-50 p-7 shadow-[0_18px_50px_rgba(8,20,36,0.07)] md:grid-cols-[110px_1fr] lg:p-10" data-process-step>
                <p className="relative z-10 font-display text-6xl font-extrabold leading-none text-accent/70" data-step-marker>
                  {item.step}
                </p>
                <div>
                  <h3 className="font-display text-3xl font-extrabold uppercase text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
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
