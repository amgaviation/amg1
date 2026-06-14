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
        "relative isolate flex min-h-[74svh] items-end overflow-hidden border-b border-slate-200 pb-16 pt-36 lg:pb-24",
        className
      )}
    >
      {image && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image || "/placeholder.svg"}
            alt=""
            className="h-full w-full scale-105 object-cover opacity-38"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_24%,rgba(59,130,246,0.18),transparent_28rem)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/82 to-white/42" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-white/36" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="pointer-events-none absolute left-6 top-[calc(var(--public-header-height)+2rem)] z-10 hidden h-[calc(100%-12rem)] w-px bg-slate-200 lg:block" aria-hidden="true">
        <span className="block h-20 w-px bg-primary/80" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal className="grid gap-10 lg:grid-cols-[1fr_18rem]" data-scroll-animate>
          <div>
            <p className="eyebrow mb-5 inline-flex items-center gap-3 text-primary">
              <span className="h-px w-12 bg-primary/70" />
              {eyebrow}
            </p>
            <h1 className="display-heading max-w-5xl text-balance text-5xl text-slate-950 sm:text-6xl lg:text-8xl">
              {title}
            </h1>
            {description && (
              <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600">
                {description}
              </p>
            )}
          </div>
          <div className="hidden self-end border-l border-slate-200 pl-6 lg:block">
            <p className="eyebrow text-[0.68rem] text-slate-500">AMG Aviation Group</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Aircraft support is reviewed before acceptance, then coordinated through clear operating responsibility.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
