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
        "relative isolate flex min-h-[82svh] items-end overflow-hidden border-b border-white/10 pb-16 pt-36 lg:pb-24",
        className
      )}
    >
      {image && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image || "/placeholder.svg"}
            alt=""
            className="h-full w-full scale-105 object-cover opacity-60"
            data-parallax="0.05"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_24%,rgba(59,130,246,0.22),transparent_28rem)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/40" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="pointer-events-none absolute left-6 top-[calc(var(--public-header-height)+2rem)] z-10 hidden h-[calc(100%-12rem)] w-px bg-white/10 lg:block" aria-hidden="true">
        <span className="block h-20 w-px bg-accent/80" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal className="grid gap-10 lg:grid-cols-[1fr_18rem]" data-scroll-animate>
          <div>
            <p className="eyebrow mb-5 inline-flex items-center gap-3 text-accent">
              <span className="h-px w-12 bg-accent/70" />
              {eyebrow}
            </p>
            <h1 className="display-heading max-w-5xl text-balance text-5xl text-foreground sm:text-6xl lg:text-8xl">
              {title}
            </h1>
            {description && (
              <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className="hidden self-end border-l border-white/15 pl-6 lg:block">
            <p className="eyebrow text-[0.68rem] text-muted-foreground">AMG Aviation Group</p>
            <p className="mt-4 text-sm leading-relaxed text-foreground/75">
              Aircraft support is reviewed before acceptance, then coordinated through clear operating responsibility.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
