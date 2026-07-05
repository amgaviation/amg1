"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importLeads, type LeadImportResult } from "@/app/portal/actions/crm";
import { Notice, SectionCard } from "@/components/portal/ui/primitives";
import { DeckSelect } from "@/components/portal/ui/fields";
import { Button } from "@/components/ui/button";
import {
  LEAD_IMPORT_TARGETS,
  MAX_IMPORT_ROWS,
  autoMapColumns,
  buildLeadImportRows,
  detectHeaderRowIndex,
  type LeadImportColumn,
} from "@/lib/portal/lead-import";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const TARGET_OPTIONS = LEAD_IMPORT_TARGETS.map((target) => ({
  value: target.value,
  label: target.label,
}));

type ParsedFile = {
  fileName: string;
  sheetName: string | null;
  columns: LeadImportColumn[];
  dataRows: unknown[][];
};

export function CrmLeadImportExport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [result, setResult] = useState<LeadImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, startImport] = useTransition();

  const preview = useMemo(
    () => (parsed ? buildLeadImportRows(parsed.dataRows, parsed.columns) : null),
    [parsed]
  );

  function reset() {
    setParsed(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleFile(file: File | undefined) {
    setResult(null);
    setError(null);
    setParsed(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("File is larger than 8 MB. Split it and try again.");
      return;
    }
    setParsing(true);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });

      // Pick the sheet with the most rows — skips cover/overview sheets.
      let sheetName: string | null = null;
      let rows: unknown[][] = [];
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        if (!sheet) continue;
        const candidate = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: null,
        });
        if (candidate.length > rows.length) {
          rows = candidate;
          sheetName = name;
        }
      }
      if (rows.length < 2) {
        setError("Could not find any data rows in that file.");
        return;
      }

      const headerIndex = detectHeaderRowIndex(rows);
      const dataRows = rows.slice(headerIndex + 1);
      if (!dataRows.length) {
        setError("The file has headers but no data rows.");
        return;
      }
      if (dataRows.length > MAX_IMPORT_ROWS) {
        setError(`That file has ${dataRows.length} rows. The limit is ${MAX_IMPORT_ROWS} per import.`);
        return;
      }
      setParsed({
        fileName: file.name,
        sheetName,
        columns: autoMapColumns(rows[headerIndex] ?? [], dataRows),
        dataRows,
      });
    } catch {
      setError("That file could not be read. Use CSV or Excel (.xlsx / .xls).");
    } finally {
      setParsing(false);
    }
  }

  function setColumnTarget(index: number, target: string) {
    setParsed((current) =>
      current
        ? {
            ...current,
            columns: current.columns.map((column) =>
              column.index === index
                ? { ...column, target: target as LeadImportColumn["target"] }
                : column
            ),
          }
        : current
    );
  }

  function runImport() {
    if (!parsed || !preview?.rows.length) return;
    startImport(async () => {
      const outcome = await importLeads({ fileName: parsed.fileName, rows: preview.rows });
      setResult(outcome);
      if (outcome.ok) {
        setParsed(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      }
    });
  }

  return (
    <SectionCard
      title="Bulk Import & Export"
      icon="upload"
      description="Upload a CSV or Excel lead list — columns are matched automatically and anything unrecognized is kept in the lead's notes. Exports round-trip back through the importer."
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <a href="/api/portal/admin/crm/export?format=csv">Export CSV</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/api/portal/admin/crm/export?format=xlsx">Export Excel</a>
          </Button>
        </>
      }
    >
      {result ? (
        result.ok ? (
          <Notice tone="success">
            Imported {result.inserted} lead{result.inserted === 1 ? "" : "s"}.
            {result.duplicates ? ` ${result.duplicates} duplicate${result.duplicates === 1 ? "" : "s"} skipped.` : ""}
            {result.invalid ? ` ${result.invalid} row${result.invalid === 1 ? "" : "s"} had no usable name and were skipped.` : ""}
          </Notice>
        ) : (
          <Notice tone="danger">{result.error ?? "The import could not be completed."}</Notice>
        )
      ) : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">
            Lead file (CSV, Excel)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xls,.xlsx"
            disabled={parsing || importing}
            onChange={(event) => handleFile(event.target.files?.[0])}
            className="deck-input cursor-pointer file:mr-3 file:cursor-pointer file:rounded-[0.25rem] file:border-0 file:bg-[var(--deck-accent-tint)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--deck-accent-ink)]"
          />
          {parsing ? (
            <span className="text-[0.7rem] text-[var(--deck-text-3)]">Reading file…</span>
          ) : null}
        </label>

        {parsed && preview ? (
          <div className="grid gap-4">
            <p className="text-sm text-[var(--deck-text-2)]">
              <span className="font-semibold text-[var(--deck-text)]">{parsed.fileName}</span>
              {parsed.sheetName ? ` · sheet “${parsed.sheetName}”` : ""} · {preview.rows.length} lead
              {preview.rows.length === 1 ? "" : "s"} ready
              {preview.skipped ? ` · ${preview.skipped} row${preview.skipped === 1 ? "" : "s"} without a usable name will be skipped` : ""}
            </p>

            {/* Column mapping */}
            <div className="deck-inset grid gap-2 p-4">
              <p className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-2)]">Column Mapping</p>
              <div className="grid gap-2">
                {parsed.columns.map((column) => (
                  <div
                    key={column.index}
                    className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem]"
                  >
                    <p className="truncate text-sm font-semibold text-[var(--deck-text)]">{column.header}</p>
                    <p className="truncate text-xs text-[var(--deck-text-3)]">{column.sample || "—"}</p>
                    <DeckSelect
                      aria-label={`Map column ${column.header}`}
                      className="!min-h-9 !text-xs"
                      options={TARGET_OPTIONS}
                      value={column.target}
                      onChange={(event) => setColumnTarget(column.index, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {preview.rows.length ? (
              <div className="deck-inset overflow-x-auto p-4">
                <p className="deck-eyebrow mb-2 !text-[0.6rem] !text-[var(--deck-text-2)]">
                  Preview (first {Math.min(preview.rows.length, 5)})
                </p>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[var(--deck-text-3)]">
                      <th className="pb-1 pr-4 font-semibold">Name</th>
                      <th className="pb-1 pr-4 font-semibold">Company</th>
                      <th className="pb-1 pr-4 font-semibold">Email</th>
                      <th className="pb-1 pr-4 font-semibold">Phone</th>
                      <th className="pb-1 pr-4 font-semibold">Stage</th>
                      <th className="pb-1 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--deck-text-2)]">
                    {preview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-[var(--deck-line)]">
                        <td className="max-w-44 truncate py-1.5 pr-4 font-semibold text-[var(--deck-text)]">{row.full_name}</td>
                        <td className="max-w-44 truncate py-1.5 pr-4">{row.company ?? "—"}</td>
                        <td className="max-w-44 truncate py-1.5 pr-4">{row.email ?? "—"}</td>
                        <td className="truncate py-1.5 pr-4">{row.phone ?? "—"}</td>
                        <td className="py-1.5 pr-4">{row.stage}</td>
                        <td className="deck-num py-1.5">{row.estimated_value ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Notice tone="warn">
                No importable leads with the current mapping. Map at least one column to Full Name or Company.
              </Notice>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={reset} disabled={importing}>
                Cancel
              </Button>
              <Button onClick={runImport} disabled={importing || !preview.rows.length}>
                {importing
                  ? "Importing…"
                  : `Import ${preview.rows.length} Lead${preview.rows.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
