import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "eyebrow mb-5 inline-flex items-center gap-3 text-primary",
            align === "center" && "justify-center"
          )}
        >
          <span className="h-px w-10 bg-primary/60" />
          {eyebrow}
        </p>
      )}
      <h2 className="display-heading text-balance text-4xl text-slate-950 sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description && (
        <p className="mt-6 text-pretty text-lg leading-relaxed text-slate-600">
          {description}
        </p>
      )}
    </Reveal>
  );
}
