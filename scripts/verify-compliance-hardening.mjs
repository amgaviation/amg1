import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;

function fail(message) {
  failed = true;
  console.error(`Compliance hardening verification failed: ${message}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function walk(dir) {
  const out = [];
  const stack = [path.join(root, dir)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && /\.(tsx?|jsx?|md)$/.test(entry.name)) out.push(full);
    }
  }
  return out;
}

function digitsOnly(value) {
  return value.replace(/\D/g, "");
}

function luhn(value) {
  let sum = 0;
  let double = false;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    let digit = Number(value[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return value.length >= 13 && value.length <= 19 && sum % 10 === 0;
}

function detectsFakeCard(value) {
  return (value.match(/(?:\d[ -]?){13,19}/g) ?? []).some((candidate) => luhn(digitsOnly(candidate)));
}

for (const file of [
  "lib/compliance/config.ts",
  "lib/compliance/evidence.ts",
  "lib/compliance/payment-data-guard.ts",
  "lib/compliance/aviation-claim-guard.ts",
  "lib/compliance/document-classification.ts",
  "app/portal/admin/security-review/page.tsx",
  "app/portal/actions/compliance.ts",
  "supabase/migrations/20260620090000_compliance_hardening_controls.sql",
  "docs/role-access-matrix.md",
  "docs/admin-security.md",
  "docs/admin-permission-review.md",
  "docs/document-classification.md",
  "docs/quote-invoice-audit.md",
  "docs/testimonial-release-process.md",
  "docs/vendor-subprocessor-inventory.md",
  "docs/launch-compliance-checklist.md",
  "docs/security-privacy-findings.md",
  "docs/compliance-hardening-qa.md",
]) {
  if (!exists(file)) fail(`missing ${file}`);
}

const migration = read("supabase/migrations/20260620090000_compliance_hardening_controls.sql");
for (const table of ["compliance_evidence_events", "content_approvals"]) {
  if (!migration.includes(`public.${table}`)) fail(`migration missing ${table}`);
  if (!migration.includes(`alter table public.${table} enable row level security`)) fail(`${table} missing RLS`);
}
for (const column of ["compliance_category", "access_level", "terms_acknowledged_at"]) {
  if (!migration.includes(column)) fail(`documents migration missing ${column}`);
}

const evidence = read("lib/compliance/evidence.ts");
for (const eventType of [
  "support_request_disclaimer_acknowledged",
  "document_terms_acknowledged",
  "quote_terms_acknowledged",
  "admin_access_review_completed",
  "sensitive_document_viewed",
]) {
  if (!evidence.includes(eventType)) fail(`evidence helper missing ${eventType}`);
}

if (!detectsFakeCard("test card 4111 1111 1111 1111")) fail("safe fake card fixture was not detected");
if (detectsFakeCard("invoice 2026-06-20 amount 1234")) fail("non-card invoice fixture was incorrectly detected");

const allowedFiles = new Set([
  "lib/compliance/aviation-claim-guard.ts",
  "docs/compliance-copy-audit.md",
  "docs/compliance-hardening-qa.md",
  "docs/launch-compliance-checklist.md",
]);
const prohibited = [
  ["book", "aircraft"],
  ["reserve", "aircraft"],
  ["charter", "now"],
  ["amg", "fleet"],
  ["our", "fleet"],
  ["operated", "by", "amg"],
  ["amg-operated"],
  ["instant", "approval"],
  ["confirmed", "instantly"],
  ["flight", "confirmed"],
  ["trip", "accepted"],
  ["emergency", "response", "guaranteed"],
  ["available", "worldwide", "guaranteed"],
  ["pay", "now"],
  ["buy", "now"],
].map((parts) => new RegExp(parts.join("\\s+"), "i"));

for (const file of ["app", "components", "lib"].flatMap(walk)) {
  const relative = path.relative(root, file);
  if (allowedFiles.has(relative)) continue;
  const body = fs.readFileSync(file, "utf8");
  for (const pattern of prohibited) {
    if (pattern.test(body)) fail(`${relative} contains direct prohibited aviation/payment claim ${pattern}`);
  }
}

if (failed) process.exit(1);
console.log("Compliance hardening verification passed.");
