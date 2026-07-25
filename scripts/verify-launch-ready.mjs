import { readFile, access } from "node:fs/promises";

/**
 * Launch-readiness preflight.
 *
 * Four things gate AMG's launch and none of them can be done by a script: bind
 * insurance, get counsel's review, publish the founder's real credentials, and
 * publish a real street address. What a script CAN do is refuse to let the
 * placeholders slip through unnoticed.
 *
 * The code checks read `lib/site-config.ts` directly rather than a checklist,
 * so they cannot be satisfied by ticking a box. The two human checks read a
 * dated line out of docs/launch-kit/CLEARANCE.md — honour system, but writing
 * "policy bound" next to a date that is not true is the same act as putting it
 * on the insurance application, and carries the same consequence under
 * Fla. Stat. §627.409.
 *
 * Deliberately NOT part of `npm test`. It is expected to fail until Tony acts,
 * and a test suite that is red by design teaches everyone to ignore it.
 *
 * Run: npm run launch:ready
 */

const root = new URL("..", import.meta.url);
const read = (p) => readFile(new URL(p, root), "utf8");
const exists = (p) => access(new URL(p, root)).then(() => true, () => false);

const config = await read("lib/site-config.ts");
const clearance = await read("docs/launch-kit/CLEARANCE.md").catch(() => "");

const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok, detail });

// --- 3. Founder credentials -----------------------------------------------
const credentials = config.match(/credentials:\s*(null|"([^"]*)")/);
check(
  "Founder credentials published",
  Boolean(credentials && credentials[2]?.trim()),
  "lib/site-config.ts TEAM_ROSTER.credentials is still null. Certificate level, "
    + "ratings, approximate total time, types, last recurrent. It renders beside a "
    + "link inviting anyone to verify it against the FAA Airman Registry.",
);

const photo = config.match(/photo:\s*(null|"([^"]*)")/);
const photoPath = photo?.[2]?.trim();
check(
  "Founder photo published",
  Boolean(photoPath) && (await exists(`public${photoPath}`)),
  photoPath
    ? `TEAM_ROSTER.photo points at ${photoPath}, which does not exist under public/.`
    : "lib/site-config.ts TEAM_ROSTER.photo is still null. A ramp or flight-deck "
      + "photo. A stock portrait is worse than none.",
);

// --- 4. Street address ------------------------------------------------------
const street = config.match(/streetAddress:\s*"([^"]*)"/)?.[1] ?? "";
const cityState = config.match(/cityState:\s*"([^"]*)"/)?.[1] ?? "";
check(
  "Real street address published",
  Boolean(street) && street !== cityState && /\d/.test(street),
  `SITE.streetAddress is "${street}" — still the city/state placeholder. CAN-SPAM `
    + "requires a valid physical postal address in every commercial email, so cold "
    + "outreach is blocked until this is real. A USPS-registered PO box or CMRA "
    + "mailbox is acceptable.",
);

// --- Affiliations -----------------------------------------------------------
// Structural now: an entry renders only once verifiedOn carries a date, so an
// unverified badge cannot reach the page. This check reports which are dark.
const affBlock = config.match(/export const AFFILIATIONS[^;]*?\n\] as const;/s)?.[0] ?? "";
const affEntries = [...affBlock.matchAll(/label:\s*"([^"]+)"\s*,\s*verifiedOn:\s*(null|"([^"]*)")/g)];
const unverified = affEntries.filter((m) => !m[3]?.trim()).map((m) => m[1]);
check(
  "Affiliations verified",
  unverified.length === 0,
  `${unverified.join(", ")} listed with verifiedOn: null, so ${unverified.length === 1 ? "it is" : "they are"} `
    + "not rendered anywhere. Confirm the membership is current and set verifiedOn "
    + "to that date, or delete the entry. Re-check annually.",
);

// --- Lead alert -------------------------------------------------------------
// Cannot be read from the repo — it lives in Vercel Production. Reported as an
// open item so it is not forgotten; the code warns loudly at runtime too.
check(
  "Lead alert SMS configured",
  false,
  "AMG_LEAD_ALERT_SMS_TO cannot be verified from here — set it in Vercel "
    + "Production (comma-separated E.164). Until then a support request at 21:40 "
    + "sends email only and pages nobody. Tick this off in CLEARANCE.md once set: "
    + "`- [x] Lead alert SMS — <last 4 digits>, YYYY-MM-DD`.",
);

// --- 1 & 2. Insurance and counsel -------------------------------------------
const dated = (label) =>
  new RegExp(`^\\s*-\\s*\\[x\\]\\s*${label}[^\\n]*\\b\\d{4}-\\d{2}-\\d{2}\\b`, "im").test(clearance);

check(
  "Aviation insurance bound",
  dated("insurance"),
  "No dated line in docs/launch-kit/CLEARANCE.md. Add `- [x] Insurance bound — "
    + "<carrier>, <policy no>, YYYY-MM-DD` once the policy is actually in force. "
    + "Describe all four services verbatim on the application (document 10) — "
    + "Fla. Stat. §627.409 lets a carrier rescind for an innocent misstatement.",
);

check(
  "Counsel review complete",
  dated("counsel"),
  "No dated line in docs/launch-kit/CLEARANCE.md. Add `- [x] Counsel review — "
    + "<firm>, YYYY-MM-DD` once the redline is back. Until then document 01 may "
    + "still be sent under the four conditions printed at its top.",
);

// --- Report -----------------------------------------------------------------
const pass = checks.filter((c) => c.ok);
const fail = checks.filter((c) => !c.ok);

for (const c of checks) console.log(`${c.ok ? "  PASS" : "  OPEN"}  ${c.name}`);

if (fail.length) {
  console.log(`\n${fail.length} of ${checks.length} still open:\n`);
  for (const c of fail) console.log(`- ${c.name}\n  ${c.detail}\n`);
  console.log("See docs/launch-kit/10-blocker-clearance.md — each one has the exact");
  console.log("artifact prepared, so none of them is more than a phone call away.\n");
  process.exit(1);
}

console.log(`\nAll ${pass.length} launch prerequisites cleared.`);
