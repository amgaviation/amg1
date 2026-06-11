import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";
import { scaleRevealVariants } from "@/lib/motion";

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
        "relative flex min-h-[72svh] items-end overflow-hidden border-b border-border pb-16 pt-36 lg:pb-24",
        className
      )}
    >
      {image && (
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image || "/placeholder.svg"}
            alt=""
            className="h-full w-full scale-105 object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/78 to-background/40" />
        </div>
      )}
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal variants={scaleRevealVariants}>
          <p className="eyebrow mb-5 text-accent">{eyebrow}</p>
          <h1 className="display-heading max-w-4xl text-balance text-5xl text-foreground sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          {description && (
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
