import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [hero, capabilities, pricing, request, form, proxy, maintenance, crm, siteConfig] = await Promise.all([
  read("components/flightdeck/hero.tsx"),
  read("components/flightdeck/capabilities.tsx"),
  read("app/(public)/pricing/page.tsx"),
  read("app/(public)/request/page.tsx"),
  read("app/(public)/request/quote-request-form.tsx"),
  read("proxy.ts"),
  read("app/(public)/portal-maintenance/page.tsx"),
  read("lib/portal/crm.ts"),
  read("lib/site-config.ts"),
]);

for (const copy of [hero, capabilities, pricing, request, form]) {
  assert.doesNotMatch(copy, /private charter|booking|aircraft-and-crew/i);
}
assert.match(hero, /Your pilot is unavailable/);
assert.match(hero, /Your aircraft still needs to move/);
assert.match(capabilities, /Insurance requires another pilot/);
assert.match(capabilities, /flight department needs overflow/i);
assert.match(pricing, /Starting at \$995/);
assert.doesNotMatch(pricing, /subscription|monthly plan/i);
assert.match(siteConfig, /Temporary contract pilot coverage/);
assert.match(siteConfig, /Insurance \/ mentor \/ second-pilot need/);
assert.match(form, /not confirmed service, a crew assignment, aircraft movement, or an operational commitment/i);
assert.match(proxy, /portal\\\/\(client\|crew\|partner\)/);
assert.match(proxy, /portal-maintenance/);
assert.match(maintenance, /External portal access is temporarily unavailable/);
assert.match(crm, /"proposal"/);
assert.match(crm, /"won"/);
assert.match(crm, /next_action_at/);

console.log("Revenue sprint copy, intake, maintenance-mode, and CRM workflow checks passed.");
