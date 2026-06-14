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
  emptyLabel = "No records.",
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
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
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
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
          {rows.map((row) => (
            <TableRow key={getKey(row)}>
              {columns.map((c, i) => (
                <TableCell
                  key={i}
                  className={cn(
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.className
                  )}
                >
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
