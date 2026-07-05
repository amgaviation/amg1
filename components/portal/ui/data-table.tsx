import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  priority?: "primary" | "secondary" | "meta";
  hideOnMobile?: boolean;
};

/**
 * Operations Deck data table: desktop table with hairline rows and a
 * stacked card list on mobile. Row-level `getHref` makes rows navigable.
 */
export function DataTable<T>({
  columns,
  rows,
  getKey,
  getHref,
  emptyLabel = "No records.",
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  getHref?: (row: T) => string | undefined;
  emptyLabel?: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] px-4 py-10 text-center text-sm text-[var(--deck-text-3)]">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="deck-card overflow-hidden">
      {/* Mobile: stacked cards */}
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row) => {
          const href = getHref?.(row);
          const primary =
            columns.find((column) => column.priority === "primary") ?? columns[0];
          const visible = columns
            .filter((column) => column !== primary && !column.hideOnMobile)
            .slice(0, 4);
          const card = (
            <div className="deck-inset deck-card-hover p-4">
              <div className="text-sm font-semibold text-[var(--deck-text)]">
                {primary.cell(row)}
              </div>
              {visible.length ? (
                <dl className="mt-3 grid gap-2">
                  {visible.map((column, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-3 border-t border-[var(--deck-line)] pt-2"
                    >
                      <dt className="deck-eyebrow !text-[0.56rem] !text-[var(--deck-text-3)]">
                        {column.header}
                      </dt>
                      <dd className="min-w-0 text-right text-xs text-[var(--deck-text)]">
                        {column.cell(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          );

          return href ? (
            <Link
              key={getKey(row)}
              href={href}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
            >
              {card}
            </Link>
          ) : (
            <div key={getKey(row)}>{card}</div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden max-w-full overflow-x-auto md:block">
        <Table className="border-0">
          <TableHeader>
            <TableRow className="border-[var(--deck-line)] bg-[var(--deck-panel-2)] hover:bg-[var(--deck-panel-2)]">
              {columns.map((c, i) => (
                <TableHead
                  key={i}
                  className={cn(
                    "h-10 text-[0.62rem] font-bold uppercase text-[var(--deck-text-3)] [letter-spacing:0.14em]",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.className
                  )}
                >
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const href = getHref?.(row);
              return (
                <TableRow
                  key={getKey(row)}
                  className={cn(
                    "border-[var(--deck-line)]",
                    href && "cursor-pointer"
                  )}
                >
                  {columns.map((c, i) => (
                    <TableCell
                      key={i}
                      className={cn(
                        "text-sm",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.className
                      )}
                    >
                      {href ? (
                        <Link
                          href={href}
                          className="block min-h-8 py-1 text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
                        >
                          {c.cell(row)}
                        </Link>
                      ) : (
                        c.cell(row)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export const PortalTable = DataTable;
