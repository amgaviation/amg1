"use client";

import { useRef, useState } from "react";
import { addNetworkProspect, importNetworkProspects } from "@/app/portal/actions/network-applications";
import { TextAreaField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";

/**
 * Manual "Add prospect" + CSV/XLSX "Import prospects" tools for the Network
 * Applications tab. Files are parsed in the browser (SheetJS for XLSX, a
 * small splitter for CSV), previewed with validation errors, then submitted
 * as normalized JSON — the server action dedupes against existing
 * applications/users by email and reports imported/duplicates/skipped.
 */

export type ParsedProspect = {
  full_name: string;
  email: string;
  phone?: string | null;
  position?: string | null;
  certificates_ratings?: string | null;
  total_hours?: number | null;
  notes?: string | null;
};

const HEADER_ALIASES: Record<string, keyof ParsedProspect | "first_name" | "last_name"> = {
  "first name": "first_name",
  firstname: "first_name",
  "last name": "last_name",
  lastname: "last_name",
  "full name": "full_name",
  name: "full_name",
  pilot: "full_name",
  email: "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  position: "position",
  role: "position",
  certificates: "certificates_ratings",
  ratings: "certificates_ratings",
  "certificates/ratings": "certificates_ratings",
  "certificates ratings": "certificates_ratings",
  "type ratings": "certificates_ratings",
  "total hours": "total_hours",
  hours: "total_hours",
  "total time": "total_hours",
  tt: "total_hours",
  notes: "notes",
  comments: "notes",
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function rowsFromMatrix(matrix: (string | number | null | undefined)[][]): {
  rows: ParsedProspect[];
  errors: string[];
} {
  if (!matrix.length) return { rows: [], errors: ["File appears to be empty."] };
  const headers = matrix[0].map((h) => HEADER_ALIASES[normalizeHeader(String(h ?? ""))] ?? null);
  if (!headers.includes("email")) {
    return { rows: [], errors: ["No email column found — an email column is required."] };
  }

  const rows: ParsedProspect[] = [];
  const errors: string[] = [];
  for (let i = 1; i < matrix.length; i += 1) {
    const raw = matrix[i];
    if (!raw || raw.every((cell) => String(cell ?? "").trim() === "")) continue;
    const record: Record<string, string> = {};
    headers.forEach((key, col) => {
      if (key) record[key] = `${record[key] ? `${record[key]} ` : ""}${String(raw[col] ?? "").trim()}`.trim();
    });

    const fullName = record.full_name || [record.first_name, record.last_name].filter(Boolean).join(" ");
    const email = (record.email ?? "").toLowerCase();
    if (!email || !isValidEmail(email)) {
      errors.push(`Row ${i + 1}: invalid or missing email — skipped.`);
      continue;
    }
    if (!fullName) {
      errors.push(`Row ${i + 1}: missing name — skipped.`);
      continue;
    }
    const hours = record.total_hours ? Number.parseFloat(record.total_hours.replace(/,/g, "")) : null;
    rows.push({
      full_name: fullName,
      email,
      phone: record.phone || null,
      position: record.position || null,
      certificates_ratings: record.certificates_ratings || null,
      total_hours: hours != null && Number.isFinite(hours) ? hours : null,
      notes: record.notes || null,
    });
  }
  return { rows, errors };
}

function parseCsv(text: string): (string)[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      out.push(row); row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); out.push(row); }
  return out;
}

export function NetworkProspectTools() {
  const [panel, setPanel] = useState<"none" | "add" | "import">("none");
  const [parsed, setParsed] = useState<{ rows: ParsedProspect[]; errors: string[]; source: "csv_import" | "xlsx_import"; filename: string } | null>(null);
  const [parseBusy, setParseBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParseBusy(true);
    try {
      const isXlsx = /\.xlsx?$/i.test(file.name) && !/\.csv$/i.test(file.name);
      let matrix: (string | number | null)[][];
      if (isXlsx) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" }) as string[][];
      } else {
        matrix = parseCsv(await file.text());
      }
      const result = rowsFromMatrix(matrix);
      setParsed({ ...result, source: isXlsx ? "xlsx_import" : "csv_import", filename: file.name });
    } catch {
      setParsed({ rows: [], errors: ["File could not be parsed. Confirm it is a valid .csv or .xlsx file."], source: "csv_import", filename: file.name });
    } finally {
      setParseBusy(false);
    }
  }

  return (
    <div className="w-full">
      <div data-portal-action-bar className="flex flex-wrap items-center gap-2">
        <Button type="button" variant={panel === "add" ? "default" : "outline"} onClick={() => setPanel(panel === "add" ? "none" : "add")}>
          Add Prospect
        </Button>
        <Button type="button" variant={panel === "import" ? "default" : "outline"} onClick={() => setPanel(panel === "import" ? "none" : "import")}>
          Import Prospects
        </Button>
      </div>

      {panel === "add" ? (
        <div className="deck-card mt-3 p-5">
          <p className="deck-eyebrow">Add Prospect</p>
          <p className="mt-1.5 text-sm text-[var(--deck-text-2)]">
            Enter a pilot who reached out directly. They join the review queue as awaiting review and flow through the same decision emails.
          </p>
          <form action={addNetworkProspect} className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField label="Full Name" name="full_name" required />
            <TextField label="Email" name="email" type="email" required />
            <TextField label="Phone" name="phone" />
            <TextField label="Position" name="position" placeholder="PIC, SIC, Contract pilot..." />
            <TextField label="Total Hours" name="total_hours" type="number" step="1" />
            <TextField label="Certificates / Ratings" name="certificates_ratings" placeholder="ATP, CE-525, ..." />
            <div className="sm:col-span-2">
              <TextAreaField label="Notes" name="notes" placeholder="How they reached out, initial impressions..." />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Adding...">Add to Review Queue</SubmitButton>
            </div>
          </form>
        </div>
      ) : null}

      {panel === "import" ? (
        <div className="deck-card mt-3 p-5">
          <p className="deck-eyebrow">Import Prospects</p>
          <p className="mt-1.5 text-sm text-[var(--deck-text-2)]">
            Upload a .csv or .xlsx with columns like first name, last name (or full name), email (required), phone, position, certificates/ratings, total hours, notes. Rows are previewed before anything imports; duplicates against existing applications and portal users are skipped automatically.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="mt-4 block w-full text-sm text-[var(--deck-text-2)] file:mr-3 file:rounded-md file:border file:border-[var(--deck-line-strong)] file:bg-[var(--deck-panel-2)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--deck-text)]"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          {parseBusy ? <p className="mt-3 text-sm text-[var(--deck-text-3)]">Parsing…</p> : null}

          {parsed ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm">
                <span className="deck-num font-semibold">{parsed.rows.length}</span> importable row{parsed.rows.length === 1 ? "" : "s"} found in <span className="font-mono text-xs">{parsed.filename}</span>
                {parsed.errors.length ? ` · ${parsed.errors.length} row issue${parsed.errors.length === 1 ? "" : "s"}` : ""}
              </p>
              {parsed.errors.length ? (
                <ul className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)] p-3 text-xs text-[var(--deck-warn)]">
                  {parsed.errors.slice(0, 20).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                  {parsed.errors.length > 20 ? <li>…and {parsed.errors.length - 20} more.</li> : null}
                </ul>
              ) : null}
              {parsed.rows.length ? (
                <div className="max-h-56 overflow-y-auto rounded-md border border-[var(--deck-line)]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Position</th>
                        <th className="px-3 py-2">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 50).map((r) => (
                        <tr key={r.email} className="border-t border-[var(--deck-line)]">
                          <td className="px-3 py-1.5">{r.full_name}</td>
                          <td className="px-3 py-1.5 font-mono">{r.email}</td>
                          <td className="px-3 py-1.5">{r.position ?? "—"}</td>
                          <td className="px-3 py-1.5 font-mono">{r.total_hours ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {parsed.rows.length ? (
                <form action={importNetworkProspects}>
                  <input type="hidden" name="source" value={parsed.source} />
                  <input type="hidden" name="rows_json" value={JSON.stringify(parsed.rows)} />
                  <SubmitButton pendingText="Importing...">
                    Import {parsed.rows.length} Prospect{parsed.rows.length === 1 ? "" : "s"}
                  </SubmitButton>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
