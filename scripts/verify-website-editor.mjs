import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let failed = false;

function fail(message) {
  failed = true;
  console.error(`Website editor verification failed: ${message}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const requiredFiles = [
  "lib/website-editor/content.ts",
  "lib/website-editor/github.ts",
  "lib/website-editor/drafts.ts",
  "app/portal/super-admin/website-editor/page.tsx",
  "app/portal/super-admin/website-editor/actions.ts",
  "app/portal/super-admin/website-editor/preview/[draftId]/page.tsx",
  "supabase/migrations/20260620120000_super_admin_website_editor.sql",
  "supabase/migrations/20260620123000_assign_tony_super_admin_profile.sql",
  "components/site/portal-screenshot-frame.tsx",
  "docs/website-editor-implementation-note.md",
  "docs/portal-screenshot-implementation-note.md",
];

for (const file of requiredFiles) {
  if (!exists(file)) fail(`missing ${file}`);
}

const contentFiles = [
  "home",
  "about",
  "services",
  "aircraft-support",
  "crew-network",
  "plans",
  "contact",
  "faqs",
  "legal",
  "amg-connect",
].map((slug) => `content/site/${slug}.json`);

for (const file of contentFiles) {
  if (!exists(file)) fail(`missing ${file}`);
  const parsed = JSON.parse(read(file));
  if (parsed.version !== 1) fail(`${file} has unsupported version`);
  if (!parsed.seo?.title || !parsed.seo?.description) fail(`${file} missing SEO fields`);
  if (!parsed.sections || !Object.keys(parsed.sections).length) fail(`${file} missing sections`);
}

for (const asset of [
  "portal-client-dashboard-enhanced.webp",
  "portal-client-requests-enhanced.webp",
  "portal-client-aircraft-enhanced.webp",
  "portal-client-documents-enhanced.webp",
  "portal-client-quotes-invoices-enhanced.webp",
  "portal-crew-dashboard-enhanced.webp",
  "portal-admin-dashboard-enhanced.webp",
  "portal-admin-requests-enhanced.webp",
  "portal-admin-aircraft-enhanced.webp",
  "portal-admin-crew-enhanced.webp",
  "portal-mobile-client-enhanced.webp",
]) {
  if (!exists(`public/images/portal-screenshots/${asset}`)) fail(`missing screenshot asset ${asset}`);
}

const constants = read("lib/portal/constants.ts");
if (!constants.includes('"super_admin"')) fail("super_admin role is not registered");
if (!constants.includes("/portal/super-admin/website-editor")) fail("super_admin home/editor route missing");
if (!constants.includes('export const PORTAL_ROLES: PortalRole[] = ["client", "crew", "admin", "partner"];')) {
  fail("public/admin-selectable PORTAL_ROLES must not include super_admin");
}

const session = read("lib/portal/session.ts");
if (!session.includes("requireSuperAdmin")) fail("requireSuperAdmin guard missing");
if (!session.includes('user.role !== "super_admin"')) fail("requireSuperAdmin must require exact super_admin role");

const shell = read("components/portal/shell/portal-shell.tsx");
if (!shell.includes('user.role === "super_admin" && role === "admin"')) {
  fail("admin portal shell must expose Website Editor navigation for signed-in super_admin users");
}

const actions = read("app/portal/super-admin/website-editor/actions.ts");
if (!actions.includes("requireSuperAdmin")) fail("editor actions do not enforce super admin");
if (!actions.includes("createWebsiteContentPullRequest")) fail("publish action missing GitHub PR flow");
if (!actions.includes("mergeWebsiteEditorPullRequest")) fail("merge action missing GitHub merge guard");

const github = read("lib/website-editor/github.ts");
for (const phrase of ["GITHUB_TOKEN", "assertApprovedContentPath", "check-runs", "merge_method"]) {
  if (!github.includes(phrase)) fail(`GitHub helper missing ${phrase}`);
}
if (github.includes("NEXT_PUBLIC_GITHUB")) fail("GitHub token must not be public");

const authActions = read("app/portal/actions/auth.ts");
if (!authActions.includes('roleValue === "super_admin"')) fail("public signup must reject super_admin role requests");

const adminActions = read("app/portal/actions/admin.ts");
if (!adminActions.includes('target.role === "super_admin"')) fail("normal admin actions must protect super_admin profiles");
if (!adminActions.includes("tony@amgaviationgroup.com")) fail("super_admin assignment must be constrained to the approved initial email");

const migration = read("supabase/migrations/20260620120000_super_admin_website_editor.sql");
for (const phrase of [
  "role = 'super_admin'",
  "tony@amgaviationgroup.com",
  "alter table public.website_content_drafts enable row level security",
  "alter table public.website_publish_events enable row level security",
  "revoke all on table public.website_content_drafts from anon",
  "grant select, insert, update on table public.website_content_drafts to authenticated",
]) {
  if (!migration.includes(phrase)) fail(`migration missing ${phrase}`);
}

const assignMigration = read("supabase/migrations/20260620123000_assign_tony_super_admin_profile.sql");
for (const phrase of ["from auth.users", "tony@amgaviationgroup.com", "role = 'super_admin'", "on conflict (id) do update"]) {
  if (!assignMigration.includes(phrase)) fail(`Tony super admin assignment migration missing ${phrase}`);
}

const publicSearch = ["app", "components", "lib", "content"].flatMap((dir) => {
  const out = [];
  const stack = [path.join(root, dir)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && /\\.(tsx?|json)$/.test(entry.name)) out.push(full);
    }
  }
  return out;
});

for (const file of publicSearch) {
  const relative = path.relative(root, file);
  const body = fs.readFileSync(file, "utf8");
  for (const phrase of ["amgconnect.app", "Airport markers", "Crew records represented", "Locations needing review"]) {
    if (body.includes(phrase)) fail(`${relative} still contains ${phrase}`);
  }
}

if (failed) process.exit(1);
console.log("Website editor and real portal screenshot verification passed.");
