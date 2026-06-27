import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { renderOperationalEmail } from "../lib/email/templates";
import { subjectWithThreadToken } from "../lib/email/threading";
import {
  CREW_EMAIL_TEMPLATES,
  buildCrewEmailVariables,
  mergeCrewEmailText,
} from "../lib/portal/crew-email-templates";

const uuid = "2578177b-161e-46a9-bc35-197df2d89958";
const acceptance = CREW_EMAIL_TEMPLATES.find((template) => template.key === "crew_network_acceptance");
assert.ok(acceptance, "crew acceptance template missing");

const variables = buildCrewEmailVariables({
  crew: {
    fullName: "Avery <script>alert(1)</script>",
    email: "avery@example.com",
    homeAirport: "KTEB",
  },
  portalLink: "https://portal.example.com/portal/crew",
  operationsEmail: "information@amgaviationgroup.com",
});

const cleanSubject = subjectWithThreadToken(acceptance.subject, uuid);
assert.equal(cleanSubject, "Accepted into the AMG Crew Network");
assert.ok(!cleanSubject.includes("[AMG-"), "crew acceptance subject must not include bracketed AMG token");
assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(cleanSubject), "crew acceptance subject must not include UUIDs");

const body = `${mergeCrewEmailText(acceptance.body, variables)}\n\nProfile name: ${variables.crew_full_name}`;
const email = renderOperationalEmail({
  title: cleanSubject,
  preheader: "You have been accepted into the AMG Crew Network.",
  body,
  portalUrl: variables.portal_link,
  showPortalCta: true,
});

assert.ok(email.text.includes("Accepted into the AMG Crew Network") || email.text.includes("accepted into the AMG Crew Network"));
assert.ok(email.html.includes("AMG Aviation Group"), "generated HTML should include the AMG global wrapper/footer");
assert.ok(email.html.includes("#050B14"), "generated HTML should include AMG Midnight Navy branding");
assert.ok(email.html.includes("Open Portal"), "crew acceptance email should include a subtle portal CTA");
assert.ok(email.html.includes("AMG support requests remain subject"), "generated HTML should include operational disclaimer");
assert.ok(email.html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "generated HTML should escape unsafe crew names");
assert.ok(!email.html.includes("<script>alert(1)</script>"), "generated HTML must not inject unsafe crew names as HTML");

const underReview = renderOperationalEmail({
  title: "AMG Support Request Under Review",
  preheader: "AMG Operations is reviewing your support request.",
  body: "AMG Operations is reviewing scope, aircraft status, crew availability, owner/operator approval, operating conditions, and final acceptance.",
  portalUrl: "https://portal.example.com/portal/client",
  showPortalCta: false,
});

assert.ok(!underReview.html.includes("Open Portal"), "Under Review email should not include portal CTA");
assert.ok(underReview.html.includes("AMG Support Request Under Review"));

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const audit = read("lib/portal/audit.ts");
assert.ok(audit.includes("sendEmail?: boolean"), "notifyUser should expose sendEmail suppression option");
assert.ok(audit.includes("params.sendEmail !== false"), "notifyUser should skip external delivery when sendEmail is false");

const crewEmail = read("lib/portal/crew-email.ts");
assert.ok(crewEmail.includes("renderOperationalEmail"), "crew emails should use the global branded renderer");
assert.ok(!crewEmail.includes("queueNotificationDeliveries"), "crew acceptance should not queue a second generic portal notification email");

const quotes = read("app/portal/actions/quotes.ts");
assert.ok(quotes.includes("sendEmail: false"), "quote portal notifications should suppress duplicate generic email after quote email sends");
assert.ok(quotes.includes("!quoteEmailSent"), "mission-contact quote fallback should only run when quote email was not sent");

const invoices = read("app/portal/actions/invoices.ts");
assert.ok(invoices.includes("sendEmail: false"), "invoice portal notifications should suppress duplicate generic email after invoice email sends");

const missions = read("app/portal/actions/missions.ts");
assert.ok(missions.includes("sendEmail: false"), "mission status portal notifications should suppress duplicate generic email after mission email sends");

console.log("email template system verification passed");
