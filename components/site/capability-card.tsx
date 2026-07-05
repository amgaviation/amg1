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
        className="hover-lift group flex h-full min-h-72 flex-col justify-between rounded-lg border border-[var(--oc-line)] bg-[#0A1322] p-7 shadow-[0_18px_50px_rgba(8,20,36,0.08)] hover:border-primary/50 hover:bg-[#0A1322]"
      >
        <div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-2xl font-extrabold uppercase leading-none text-[var(--oc-ink)] sm:text-3xl">
              {title}
            </h3>
            <ArrowUpRight className="h-6 w-6 shrink-0 text-[var(--oc-aluminum-2)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
          </div>
          <p className="mt-6 leading-relaxed text-[var(--oc-muted)]">{summary}</p>
        </div>
        {useCase && (
          <p className="mt-8 border-t border-[var(--oc-line)] pt-5 text-sm leading-relaxed text-[var(--oc-muted)]">
            <span className="font-semibold text-primary">Use case:</span> {useCase}
          </p>
        )}
      </Link>
    </RevealItem>
  );
}
