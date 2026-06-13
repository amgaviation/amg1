import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RevealItem } from "@/components/site/reveal";

export function CapabilityCard({
  title,
  summary,
  useCase,
  href = "/contact",
}: {
  title: string;
  summary: string;
  useCase?: string;
  href?: string;
}) {
  return (
    <RevealItem>
      <Link
        href={href}
        className="glass-panel hover-lift group flex h-full min-h-80 flex-col justify-between rounded-lg p-7 hover:border-accent/60 hover:bg-secondary/60"
        data-cursor="OPEN"
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-3xl font-extrabold uppercase leading-none tracking-wide text-foreground">
              {title}
            </h3>
            <ArrowUpRight className="h-6 w-6 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent" />
          </div>
          <p className="mt-6 leading-relaxed text-muted-foreground">{summary}</p>
        </div>
        {useCase && (
          <p className="mt-8 border-t border-border pt-5 text-sm leading-relaxed text-foreground/75">
            <span className="text-accent">Use case:</span> {useCase}
          </p>
        )}
      </Link>
    </RevealItem>
  );
}
