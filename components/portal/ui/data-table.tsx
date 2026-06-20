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
  getHref?: (row: T) => string;
  emptyLabel?: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-[0_10px_28px_rgba(8,20,36,0.04)]">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50/90">
            {columns.map((c, i) => (
              <TableHead
                key={i}
                className={cn(
                  "whitespace-nowrap text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500",
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
                  "border-slate-100 transition-colors hover:bg-slate-50/80",
                  href && "group cursor-pointer"
                )}
              >
                {columns.map((c, i) => (
                  <TableCell
                    key={i}
                    className={cn(
                      "align-middle text-sm text-slate-700",
                      href && "p-0",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.className
                    )}
                  >
                    {href ? (
                      <Link
                        href={href}
                        className={cn(
                          "block px-4 py-4 text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                          c.align === "right" && "text-right",
                          c.align === "center" && "text-center"
                        )}
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
  );
}
