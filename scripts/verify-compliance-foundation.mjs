import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`Compliance verification failed: ${message}`);
    process.exitCode = 1;
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const legalPages = read("lib/compliance/legal-pages.ts");
const consent = read("lib/compliance/consent.ts");
const migration = read("supabase/migrations/20260620070000_legal_compliance_foundation.sql");
const footer = read("lib/content.ts");
const layout = read("app/layout.tsx");
const publicForms = `${read("components/site/contact-inquiry-form.tsx")}\n${read("components/site/support-request-form.tsx")}`;

const requiredSlugs = [
  "privacy-policy",
  "cookie-policy",
  "terms",
  "client-portal-terms",
  "crew-portal-terms",
  "vendor-portal-terms",
  "accessibility",
  "mission-acceptance",
  "credential-submission",
  "document-upload-terms",
  "sms-terms",
  "email-communications",
  "copyright-dmca",
  "trademark-disclaimer",
  "media-use-notice",
  "privacy-choices",
  "subprocessors",
  "data-retention",
];

for (const slug of requiredSlugs) {
  assert(legalPages.includes(`slug: "${slug}"`), `missing legal slug ${slug}`);
}

const requiredCategories = [
  "necessary",
  "analytics",
  "marketing",
  "session_recording",
  "embedded_tools",
];

for (const category of requiredCategories) {
  assert(consent.includes(`id: "${category}"`) || consent.includes(`| "${category}"`), `missing consent category ${category}`);
}

for (const table of ["privacy_requests", "marketing_consents", "consent_events", "compliance_audit_events"]) {
  assert(migration.includes(`public.${table}`), `migration missing ${table}`);
  assert(migration.includes(`alter table public.${table} enable row level security`), `${table} missing RLS enablement`);
}

for (const route of ["/privacy-policy", "/privacy-choices", "/cookie-policy", "/terms", "/mission-acceptance", "/credential-submission", "/accessibility", "/legal"]) {
  assert(footer.includes(route), `footer missing ${route}`);
}

assert(layout.includes("CookieConsentBanner"), "root layout missing CookieConsentBanner");
assert(layout.includes("ConsentScriptLoader"), "root layout missing ConsentScriptLoader");
assert(publicForms.includes("marketing_consent"), "public forms missing marketing_consent");
assert(publicForms.includes("sms_consent"), "public forms missing sms_consent");

for (const doc of [
  "docs/legal-compliance-foundation.md",
  "docs/privacy-data-map.md",
  "docs/cookie-consent-setup.md",
  "docs/accessibility.md",
  "docs/accessibility-qa-checklist.md",
  "docs/incident-response.md",
  "docs/compliance-qa-checklist.md",
  "docs/legal-review-notes.md",
  "docs/asset-register.md",
  "docs/ai-media-register.md",
]) {
  assert(exists(doc), `missing documentation file ${doc}`);
}

const textTargets = [
  "app",
  "components",
  "lib",
].flatMap((dir) => {
  const files = [];
  const stack = [path.join(root, dir)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && /\.(tsx?|jsx?|md)$/.test(entry.name)) files.push(full);
    }
  }
  return files;
});

const prohibited = [
  new RegExp(["book", "now"].join("\\s+"), "i"),
  new RegExp(["pay", "now"].join("\\s+"), "i"),
  new RegExp(["binding", "charter", "contract"].join("\\s+"), "i"),
];
for (const file of textTargets) {
  const relative = path.relative(root, file);
  const body = fs.readFileSync(file, "utf8");
  for (const pattern of prohibited) {
    assert(!pattern.test(body), `${relative} contains prohibited language ${pattern}`);
  }
}

if (!process.exitCode) {
  console.log("Compliance foundation verification passed.");
}
