import { WORKED_EXAMPLE } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * The worked mission example (Business Plan §6.2, spec §3 trust block).
 * Rendered as a styled card on Home and Pricing with identical numbers.
 */
export function WorkedExample({ className }: { className?: string }) {
  return (
    <div data-tally className={cn("oc-card-dark overflow-hidden", className)}>
      <div className="border-b border-[var(--oc-line-dark)] px-6 py-5 sm:px-8">
        <p className="oc-eyebrow oc-eyebrow-light">Worked example</p>
        <h3 className="oc-display mt-2 text-2xl text-[var(--oc-paper)] sm:text-3xl">
          {WORKED_EXAMPLE.title}
        </h3>
        <p className="mt-2 text-sm text-[var(--oc-aluminum)]">{WORKED_EXAMPLE.scenario}</p>
      </div>
      <dl className="px-6 py-5 sm:px-8">
        {WORKED_EXAMPLE.lines.map((line) => (
          <div
            key={line.label}
            data-tally-line
            className="flex items-baseline justify-between gap-4 border-b border-dashed border-[var(--oc-line-dark)] py-2.5 last:border-0"
          >
            <dt className="text-sm text-[var(--oc-aluminum)]">{line.label}</dt>
            <dd className="oc-mono text-base text-[var(--oc-paper)]">{line.amount}</dd>
          </div>
        ))}
      </dl>
      <div data-tally-total className="bg-white/[0.04] px-6 py-5 sm:px-8">
        <p className="oc-display text-2xl text-[var(--oc-paper)] sm:text-[1.75rem]">
          {WORKED_EXAMPLE.total}
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--oc-aluminum)]">
          {WORKED_EXAMPLE.note}
        </p>
      </div>
    </div>
  );
}
