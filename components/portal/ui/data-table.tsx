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
      <div className="rounded-lg border border-dashed border-white/16 bg-white/[0.04] px-4 py-8 text-center text-sm text-slate-400">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/10 bg-[#07111F]/88 shadow-[0_18px_58px_rgba(0,0,0,0.2)]">
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row) => {
          const href = getHref?.(row);
          const primary = columns.find((column) => column.priority === "primary") ?? columns[0];
          const visible = columns.filter((column) => column !== primary && !column.hideOnMobile).slice(0, 4);
          const card = (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-primary/45">
              <div className="text-sm font-semibold text-white">{primary.cell(row)}</div>
              {visible.length ? (
                <dl className="mt-3 grid gap-2">
                  {visible.map((column, index) => (
                    <div key={index} className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {column.header}
                      </dt>
                      <dd className="min-w-0 text-right text-xs text-slate-200">{column.cell(row)}</dd>
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

      <div className="hidden overflow-hidden md:block">
      <Table className="border-0">
        <TableHeader>
          <TableRow className="bg-white/[0.045] hover:bg-white/[0.045]">
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
                className={cn("border-white/10", href && "cursor-pointer hover:bg-white/[0.045]")}
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
