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
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row) => {
          const href = getHref?.(row);
          const primary = columns.find((column) => column.priority === "primary") ?? columns[0];
          const visible = columns.filter((column) => column !== primary && !column.hideOnMobile).slice(0, 4);
          const card = (
            <div className="rounded-lg border border-border bg-white p-4 transition-colors hover:border-primary/45 hover:bg-blue-50/45">
              <div className="text-sm font-semibold text-foreground">{primary.cell(row)}</div>
              {visible.length ? (
                <dl className="mt-3 grid gap-2">
                  {visible.map((column, index) => (
                    <div key={index} className="flex items-start justify-between gap-3 border-t border-border pt-2">
                      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {column.header}
                      </dt>
                      <dd className="min-w-0 text-right text-xs text-foreground">{column.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          );

          return href ? (
            <Link key={getKey(row)} href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
              {card}
            </Link>
          ) : (
            <div key={getKey(row)}>{card}</div>
          );
        })}
      </div>

      <div className="hidden max-w-full overflow-hidden bg-white md:block">
      <Table className="border-0">
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            {columns.map((c, i) => (
              <TableHead
                key={i}
                className={cn(
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
                className={cn("border-border", href && "cursor-pointer hover:bg-blue-50/45")}
              >
                {columns.map((c, i) => (
                  <TableCell
                    key={i}
                    className={cn(
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className
                    )}
                  >
                    {href ? (
                      <Link href={href} className="block min-h-8 py-1 text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
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
