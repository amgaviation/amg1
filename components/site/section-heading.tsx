import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
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
            align === "center" && "justify-center",
            tone === "light" && "text-[var(--oc-blue)]"
          )}
        >
          <span className="h-px w-10 bg-primary/60" />
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "display-heading text-balance text-4xl sm:text-5xl lg:text-6xl",
          tone === "light" ? "text-white" : "text-[var(--oc-ink)]"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-6 text-pretty text-lg leading-relaxed",
            tone === "light" ? "text-[var(--oc-aluminum)]" : "text-[var(--oc-muted)]"
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
