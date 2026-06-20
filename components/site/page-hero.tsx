import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  image?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate flex min-h-[68svh] items-end overflow-hidden border-b border-slate-950/20 bg-slate-950 pb-14 pt-32 text-white lg:pb-18",
        className
      )}
    >
      {image && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="h-full w-full scale-105 object-cover opacity-76"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,11,20,0.92)_0%,rgba(5,11,20,0.72)_45%,rgba(5,11,20,0.22)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,20,0.5)_0%,rgba(5,11,20,0.12)_40%,rgba(5,11,20,0.9)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_26%,rgba(59,130,246,0.18),transparent_28rem)]" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-t from-slate-950/86 to-transparent" />
      <div className="pointer-events-none absolute left-6 top-[calc(var(--public-header-height)+2rem)] z-10 hidden h-[calc(100%-12rem)] w-px bg-white/12 lg:block" aria-hidden="true">
        <span className="block h-20 w-px bg-accent/90" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]" data-scroll-animate>
          <div className="max-w-5xl">
            <p className="eyebrow mb-5 inline-flex items-center gap-3 text-[var(--amg-light-gray)]">
              <span className="h-px w-12 bg-primary/80" />
              {eyebrow}
            </p>
            <h1 className="display-heading max-w-5xl text-balance text-5xl text-white sm:text-6xl lg:text-8xl">
              {title}
            </h1>
            {description && (
              <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-slate-200">
                {description}
              </p>
            )}
          </div>
          <div className="hidden self-end rounded-lg border border-white/14 bg-white/10 p-5 backdrop-blur-xl lg:block">
            <p className="eyebrow text-[0.68rem] text-[var(--amg-light-gray)]">AMG Aviation Group</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              Aircraft support is reviewed before acceptance, then coordinated through clear operating responsibility.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
