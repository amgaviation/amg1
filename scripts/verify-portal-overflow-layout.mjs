import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const portalShell = read("components/portal/shell/portal-shell.tsx");
const adminRecordManager = read("components/portal/admin/admin-record-manager.tsx");
const dataTable = read("components/portal/ui/data-table.tsx");
const table = read("components/ui/table.tsx");
const globals = read("app/globals.css");

assert.match(
  portalShell,
  /amg-portal[^"]*min-h-screen[^"]*bg-slate-50[^"]*overflow-hidden/,
  "PortalShell root must provide a light background and prevent page-level horizontal overflow",
);

assert.match(
  portalShell,
  /<main className="[^"]*w-full[^"]*max-w-full[^"]*min-w-0[^"]*overflow-hidden/,
  "PortalShell main content must constrain overflow before table-level scrolling",
);

assert.match(
  adminRecordManager,
  /<section className="[^"]*w-full[^"]*max-w-full[^"]*overflow-hidden[^"]*bg-white/,
  "AdminRecordManager card must be a full-width white overflow boundary",
);

assert.match(
  adminRecordManager,
  /data-admin-record-table-scroller[^>]*className="[^"]*overflow-x-auto[^"]*bg-white/,
  "AdminRecordManager desktop table must scroll horizontally inside a white scroller",
);

assert.match(
  adminRecordManager,
  /data-portal-table-actions[^>]*className="[^"]*min-w-\[17rem\]/,
  "AdminRecordManager action cells must reserve enough width for multiple row actions",
);

assert.match(
  adminRecordManager,
  /data-portal-action-bar[^>]*className="[^"]*flex[^"]*flex-wrap[^"]*justify-end/,
  "AdminRecordManager row actions must wrap instead of overlapping",
);

assert.match(
  adminRecordManager,
  /<table className="[^"]*min-w-\[[^\]]+\][^"]*bg-white/,
  "AdminRecordManager table must have an explicit scroll width and white background",
);

assert.match(
  adminRecordManager,
  /<thead className="[^"]*bg-slate-50/,
  "AdminRecordManager table header must have an explicit light background",
);

assert.match(
  adminRecordManager,
  /<tbody className="[^"]*bg-white/,
  "AdminRecordManager table body must have an explicit white background",
);

assert.match(
  dataTable,
  /rounded-lg[^"]*overflow-hidden[^"]*bg-white/,
  "Shared DataTable outer card must keep a white background across table pages",
);

assert.match(
  table,
  /overflow-x-auto[^"]*bg-white/,
  "Base Table scroller must expose a white horizontal scroll surface",
);

assert.match(
  globals,
  /\.amg-portal table\s*{\s*color:\s*#334155;/,
  "Portal tables must use readable slate text instead of inheriting dark public-site text tokens",
);

assert.match(
  globals,
  /\.amg-portal \[data-portal-action-bar\]\s*{\s*min-width:\s*0;/,
  "Portal must provide a global action-bar layout rule for future buttons",
);

assert.match(
  globals,
  /\.amg-portal \[data-portal-table-actions\]\s*{\s*min-width:\s*17rem;/,
  "Portal table action columns must have a global minimum width",
);

console.log("portal overflow layout verification passed");
