import { cn } from "@/lib/utils";

export type DescriptionItem = {
  label: string;
  value: React.ReactNode;
  /** Render the value in JetBrains Mono — refs, tail numbers, amounts, ICAO. */
  mono?: boolean;
  /** Span both columns in the two-column layout. */
  wide?: boolean;
};

/**
 * Standard detail-page fact sheet: responsive two-column definition list with
 * mono microlabels. Formalizes the DetailRow pattern for the Detail archetype;
 * prefer this over ad-hoc <dl> grids in new/reworked pages.
 */
export function DescriptionList({
  items,
  columns = 2,
  className,
}: {
  items: DescriptionItem[];
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-8",
        columns === 2 ? "sm:grid-cols-2" : undefined,
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className={cn(
            "border-b border-[var(--deck-line)] py-2.5 last:border-0",
            item.wide && columns === 2 && "sm:col-span-2"
          )}
        >
          <dt className="deck-micro text-[var(--deck-text-3)]">{item.label}</dt>
          <dd
            className={cn(
              "mt-1 min-w-0 break-words text-sm leading-6 text-[var(--deck-text)]",
              item.mono && "deck-mono !text-[0.8rem]"
            )}
          >
            {item.value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
