import fs from "node:fs";

const requiredFiles = [
  "lib/errors/user-facing-errors.ts",
  "lib/email/provider.ts",
  "lib/email/resend-provider.ts",
  "lib/email/inbound.ts",
  "lib/portal/communications.ts",
  "app/portal/admin/messages/page.tsx",
  "app/api/webhooks/email/inbound/route.ts",
  "app/api/webhooks/email/status/route.ts",
  "app/api/communications/send/route.ts",
  "docs/communications-center.md",
  "tests/fixtures/email-inbound.json",
];

const migration = "supabase/migrations/20260620043000_portal_communications_center.sql";
const requiredTables = [
  "communication_threads",
  "communication_messages",
  "communication_participants",
  "communication_attachments",
  "communication_templates",
  "communication_audit_log",
  "communication_user_state",
];

function assert(condition, message) {
  if (!condition) {
    console.error(`communications verification failed: ${message}`);
    process.exit(1);
  }
}

for (const file of requiredFiles) {
  assert(fs.existsSync(file), `missing ${file}`);
}

const migrationSql = fs.readFileSync(migration, "utf8");
for (const table of requiredTables) {
  assert(migrationSql.includes(`public.${table}`), `migration missing ${table}`);
  assert(migrationSql.includes(`alter table public.${table} enable row level security`), `migration missing RLS for ${table}`);
}

assert(migrationSql.includes("communication-attachments"), "migration missing private communication attachment bucket");
assert(migrationSql.includes("Support Request Received"), "migration missing default operational templates");
assert(migrationSql.includes("No request is considered accepted"), "migration missing operational acceptance disclaimer");

const safeErrors = fs.readFileSync("lib/errors/user-facing-errors.ts", "utf8");
assert(safeErrors.includes("information@amgaviationgroup.com"), "safe errors missing AMG contact email");
assert(!safeErrors.includes("Something went wrong"), "safe errors use casual generic language");
assert(safeErrors.includes("public_contact"), "safe errors missing public contact context");
assert(safeErrors.includes("request_support"), "safe errors missing request support context");
assert(safeErrors.includes("communications"), "safe errors missing communications context");

const adminPage = fs.readFileSync("app/portal/admin/messages/page.tsx", "utf8");
assert(adminPage.includes("Internal Note"), "admin UI missing internal note affordance");
assert(adminPage.includes("Link Records"), "admin UI missing record linking");
assert(adminPage.includes("Preview operational templates"), "admin UI missing template preview");
assert(adminPage.includes("Email sending is disabled"), "admin UI missing provider disabled state");

const fixture = JSON.parse(fs.readFileSync("tests/fixtures/email-inbound.json", "utf8"));
assert(fixture.id && fixture.data?.subject && fixture.data?.from?.email, "inbound fixture missing required fields");

console.log("communications center verification passed");
