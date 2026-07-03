import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const migrationPath = "supabase/migrations/20260703090000_portal_edit_constraint_rls_repair.sql";
const migration = read(migrationPath);
const constants = read("lib/portal/constants.ts");
const adminAircraftPage = read("app/portal/admin/aircraft/page.tsx");
const adminAircraftDetailPage = read("app/portal/admin/aircraft/[aircraftId]/page.tsx");
const adminActions = read("app/portal/actions/admin.ts");
const quoteActions = read("app/portal/actions/quotes.ts");
const invoiceActions = read("app/portal/actions/invoices.ts");

function valuesFromArray(source, declaration) {
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, `missing ${declaration}`);
  const end = source.indexOf("];", start);
  assert.notEqual(end, -1, `unterminated ${declaration}`);
  return [...source.slice(start, end).matchAll(/value:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function assertMigrationHasValues(values, context) {
  for (const value of values) {
    assert.ok(migration.includes(`'${value}'`), `${context} missing ${value} in ${migrationPath}`);
  }
}

const quoteStatuses = valuesFromArray(constants, "export const QUOTE_STATUS");
const expenseStatuses = valuesFromArray(constants, "export const EXPENSE_STATUS");
const aircraftStatuses = valuesFromArray(adminAircraftPage, "const aircraftStatusOptions");
const aircraftMaintenanceStatuses = valuesFromArray(adminAircraftPage, "const maintenanceOptions");
const aircraftDetailMaintenanceStatuses = valuesFromArray(adminAircraftDetailPage, "const maintenanceOptions");

assert.deepEqual(aircraftDetailMaintenanceStatuses, aircraftMaintenanceStatuses, "aircraft list/detail maintenance statuses diverged");

assertMigrationHasValues(aircraftStatuses, "aircraft status constraint");
assertMigrationHasValues(aircraftMaintenanceStatuses, "aircraft maintenance_status constraint");
assertMigrationHasValues(quoteStatuses, "quote status constraint");
assertMigrationHasValues(["accepted"], "legacy invoice quote selector compatibility");
assertMigrationHasValues(expenseStatuses, "expense status constraint");

for (const constraint of [
  "aircraft_status_check",
  "aircraft_maintenance_status_check",
  "quotes_status_check",
  "expenses_status_check",
]) {
  assert.ok(migration.includes(`drop constraint if exists ${constraint}`), `${constraint} is not safely replaced`);
  assert.ok(migration.includes(`add constraint ${constraint}`), `${constraint} is not recreated`);
}

for (const needle of [
  'update({ status: "archived"',
  'maintenance_status: str(formData, "maintenance_status")',
]) {
  assert.ok(adminActions.includes(needle), `admin aircraft action missing ${needle}`);
}

for (const needle of ['status: "converted"', 'status: "draft"', '"void"', '"revision_requested"']) {
  assert.ok(quoteActions.includes(needle), `quote action missing ${needle}`);
}

assert.ok(invoiceActions.includes('status: "added_to_invoice"'), "invoice action no longer marks expenses as added_to_invoice");
assert.ok(invoiceActions.includes('"partially_approved"'), "invoice action no longer accepts partially approved expenses");

for (const needle of [
  "source_submission_id",
  "source_form_type",
  "assigned_admin_id",
  "archived_at",
  'drop policy if exists "Admins manage public support requests"',
  'create policy "Admins manage public support requests"',
  'drop policy if exists "Clients read own public support requests"',
  'create policy "Clients read own public support requests"',
  "grant select, update on table public.public_support_requests to authenticated",
]) {
  assert.ok(migration.includes(needle), `support request repair missing ${needle}`);
}

for (const needle of [
  "alter table public.partner_profiles enable row level security",
  'drop policy if exists "Admins manage partner profiles"',
  'create policy "Admins manage partner profiles"',
  'drop policy if exists "Partners read own partner profile"',
  'create policy "Partners read own partner profile"',
  'drop policy if exists "Partners insert own partner profile"',
  'create policy "Partners insert own partner profile"',
  'drop policy if exists "Partners update own partner profile"',
  'create policy "Partners update own partner profile"',
]) {
  assert.ok(migration.includes(needle), `partner profile RLS repair missing ${needle}`);
}

assert.ok(migration.includes("p.role in ('admin', 'super_admin')"), "admin RLS policies must include super_admin");
assert.ok(migration.includes("select pg_notify('pgrst', 'reload schema')"), "migration must reload PostgREST schema cache");

console.log("Portal Supabase edit contract verification passed.");
