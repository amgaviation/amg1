import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CREW_EMAIL_TEMPLATE_KEYS,
  CREW_EMAIL_TEMPLATES,
  buildCrewEmailVariables,
  mergeCrewEmailText,
} from "../lib/portal/crew-email-templates";

const expectedKeys = [
  "crew_network_acceptance",
  "account_suspension",
  "mission_request",
  "document_request",
  "logbook_request",
  "post_mission_follow_up",
  "credential_expiration_reminder",
  "profile_information_request",
  "mission_availability_check",
  "general_crew_communication",
];

assert.deepEqual(CREW_EMAIL_TEMPLATE_KEYS, expectedKeys, "crew template keys changed unexpectedly");
assert.equal(CREW_EMAIL_TEMPLATES.length, 10, "expected ten starter crew email templates");

for (const template of CREW_EMAIL_TEMPLATES) {
  assert.ok(template.key, `template ${template.name} is missing a key`);
  assert.ok(template.name, `template ${template.key} is missing a display name`);
  assert.ok(template.category, `template ${template.key} is missing a category`);
  assert.ok(template.subject, `template ${template.key} is missing a default subject`);
  assert.ok(template.body, `template ${template.key} is missing a default body`);
  assert.ok(template.variables.includes("crew_full_name"), `${template.key} missing crew_full_name variable`);
}

const variables = buildCrewEmailVariables({
  crew: {
    fullName: "Avery Stone",
    email: "avery@example.com",
    homeAirport: "KTEB",
  },
  mission: {
    id: "MSN-1004",
    date: "2026-07-14",
    departureAirport: "KTEB",
    arrivalAirport: "KPBI",
    aircraftType: "Gulfstream G550",
    tailNumber: "N721AG",
  },
  requestedDocuments: "medical certificate, recurrent training record",
  portalLink: "https://portal.example.com/portal/crew",
  operationsEmail: "ops@example.com",
});

assert.equal(variables.crew_first_name, "Avery");
assert.equal(variables.crew_full_name, "Avery Stone");
assert.equal(variables.home_airport, "KTEB");
assert.equal(variables.mission_id, "MSN-1004");

const merged = mergeCrewEmailText(
  "Hello {{crew_first_name}}, review {{mission_id}} from {{departure_airport}} to {{arrival_airport}}. Unknown: {{not_supported}}.",
  variables,
);

assert.equal(
  merged,
  "Hello Avery, review MSN-1004 from KTEB to KPBI. Unknown: {{not_supported}}.",
  "merge should replace supported variables and leave unknown placeholders visible",
);

const missionTemplate = CREW_EMAIL_TEMPLATES.find((template) => template.key === "mission_request");
assert.ok(missionTemplate, "mission request template missing");
assert.match(
  missionTemplate.body,
  /not assigned|not confirmed/i,
  "mission request template must not imply assignment before confirmation",
);

const latestMigration = fs
  .readdirSync(path.join(process.cwd(), "supabase/migrations"))
  .filter((file) => file.endsWith("_crew_email_templates.sql"))
  .sort()
  .at(-1);

assert.ok(latestMigration, "missing crew email templates migration");
const migrationSql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations", latestMigration), "utf8");

assert.match(migrationSql, /alter table public\.communication_templates/i);
assert.match(migrationSql, /template_key/i);
assert.match(migrationSql, /variables jsonb/i);
for (const key of expectedKeys) {
  assert.ok(migrationSql.includes(key), `migration missing template key ${key}`);
}

const requiredRoutes = [
  "app/portal/admin/crew/[crewId]/page.tsx",
  "app/portal/admin/crew/[crewId]/loading.tsx",
  "app/portal/admin/crew/[crewId]/error.tsx",
  "app/portal/admin/aircraft/[aircraftId]/page.tsx",
  "app/portal/admin/aircraft/[aircraftId]/loading.tsx",
  "app/portal/admin/aircraft/[aircraftId]/error.tsx",
  "app/portal/admin/clients/[clientId]/page.tsx",
  "app/portal/admin/clients/[clientId]/loading.tsx",
  "app/portal/admin/clients/[clientId]/error.tsx",
  "app/portal/admin/partners/[partnerId]/page.tsx",
  "app/portal/admin/partners/[partnerId]/loading.tsx",
  "app/portal/admin/partners/[partnerId]/error.tsx",
];

for (const route of requiredRoutes) {
  assert.ok(fs.existsSync(path.join(process.cwd(), route)), `missing detail route ${route}`);
}

const crewDetail = fs.readFileSync(path.join(process.cwd(), "app/portal/admin/crew/[crewId]/page.tsx"), "utf8");
const crewComposer = fs.readFileSync(path.join(process.cwd(), "components/portal/admin/crew-email-composer.tsx"), "utf8");
assert.ok(crewDetail.includes("CrewEmailComposer"), "crew detail page missing crew email composer");
assert.ok(crewComposer.includes("Send Email"), "crew email composer missing Send Email action");
assert.ok(crewDetail.includes("Communications"), "crew detail page missing Communications tab");

console.log("crew email workflow verification passed");
