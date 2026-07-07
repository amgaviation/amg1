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
  /amg-portal[^"]*min-h-screen[^"]*bg-\[var\(--deck-canvas\)\][^"]*overflow-x-clip/,
  "PortalShell root must clip horizontal overflow without creating a scroll container (overflow-x-clip keeps the sticky sidebar anchored to the viewport; plain overflow-hidden re-anchors sticky to the root and breaks the fixed sidebar)",
);

assert.match(
  portalShell,
  /<main className="[^"]*w-full[^"]*max-w-full[^"]*min-w-0[^"]*overflow-hidden/,
  "PortalShell main content must constrain overflow before table-level scrolling",
);

assert.match(
  adminRecordManager,
  /<section className="[^"]*deck-card[^"]*w-full[^"]*max-w-full[^"]*overflow-hidden/,
  "AdminRecordManager card must be a full-width panel overflow boundary",
);

assert.match(
  adminRecordManager,
  /data-admin-record-table-scroller[^>]*className="[^"]*overflow-x-auto[^"]*bg-\[var\(--deck-panel\)\]/,
  "AdminRecordManager desktop table must scroll horizontally inside an opaque panel-token scroller",
);

// Console Record Pattern: rows carry a single Open/View affordance — archive
// and record actions live inside the record window — so the reserved action
// width shrank from 17rem to one button's worth.
assert.match(
  adminRecordManager,
  /data-portal-table-actions[^>]*className="[^"]*min-w-\[6\.5rem\]/,
  "AdminRecordManager action cells must reserve width for the row's Open control",
);

assert.match(
  adminRecordManager,
  /data-portal-action-bar[^>]*className="[^"]*flex[^"]*flex-wrap[^"]*justify-end/,
  "AdminRecordManager row actions must wrap instead of overlapping",
);

assert.match(
  adminRecordManager,
  /<table className="[^"]*min-w-\[[^\]]+\][^"]*bg-\[var\(--deck-panel\)\]/,
  "AdminRecordManager table must have an explicit scroll width and opaque panel-token background",
);

assert.match(
  adminRecordManager,
  /<thead className="[^"]*bg-\[var\(--deck-panel-2\)\]/,
  "AdminRecordManager table header must have an explicit panel-2 token background",
);

assert.match(
  adminRecordManager,
  /<tbody className="[^"]*bg-\[var\(--deck-panel\)\]/,
  "AdminRecordManager table body must have an explicit opaque panel-token background",
);

assert.match(
  dataTable,
  /deck-card[^"]*overflow-hidden/,
  "Shared DataTable outer card must be a panel-surface overflow boundary",
);

assert.match(
  table,
  /overflow-x-auto[^"]*bg-\[var\(--deck-panel/,
  "Base Table scroller must expose an opaque panel-token horizontal scroll surface",
);

assert.match(
  globals,
  /\.amg-portal table\s*{\s*color:\s*var\(--deck-text-2\);/,
  "Portal tables must use readable deck text instead of inheriting dark public-site text tokens",
);

assert.match(
  globals,
  /\.amg-portal \[data-portal-action-bar\]\s*{\s*min-width:\s*0;/,
  "Portal must provide a global action-bar layout rule for future buttons",
);

assert.match(
  globals,
  /\.amg-portal \[data-portal-table-actions\]\s*{[^}]*min-width:\s*6\.5rem;/,
  "Portal table action columns must have a global minimum width",
);

console.log("portal overflow layout verification passed");
