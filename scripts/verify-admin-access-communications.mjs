import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

const checks = [];

function check(name, ok, detail) {
  checks.push({ name, ok, detail });
}

const authActions = read("app/portal/actions/auth.ts");
const adminActions = read("app/portal/actions/admin.ts");
const accountSetup = read("lib/portal/account-setup.ts");
const portalLogin = read("components/site/portal-login.tsx");
const shell = read("components/portal/shell/portal-shell.tsx");
const constants = read("lib/portal/constants.ts");
const usersPage = read("app/portal/admin/users/page.tsx");

const signUpMatch = authActions.match(/export async function signUp[\s\S]*?^}/m);
const signUpBody = signUpMatch?.[0] ?? "";

check(
  "public access requests do not call Supabase Auth signUp",
  !/\.auth\.signUp\s*\(/.test(signUpBody),
  "Remove auth.signUp from the signUp access-request server action.",
);
check(
  "access request form does not ask for an account password",
  !/Create password/.test(portalLogin) && !/name="password"[\s\S]{0,120}autoComplete="new-password"/.test(portalLogin),
  "The public request form should not collect a password before admin approval.",
);
check(
  "admin setup uses server-side branded account email helper",
  /sendPortalAccountSetupEmail/.test(accountSetup) &&
    /ensurePortalAuthUserForProfile/.test(adminActions) &&
    /generateLink/.test(accountSetup),
  "Admin approval/onboarding should generate a server-side setup link and send an AMG email.",
);
check(
  "admin setup does not use Supabase invite emails",
  !/inviteUserByEmail/.test(adminActions),
  "Replace Supabase inviteUserByEmail with AMG branded setup emails.",
);
check(
  "admin nav exposes required grouped categories",
  ["Operations", "Financial", "Communications", "Users", "Settings"].every((label) => shell.includes(label)),
  "PortalShell should render grouped admin navigation categories.",
);
check(
  "Emails nav route exists",
  constants.includes("/portal/admin/communications/emails") && exists("app/portal/admin/communications/emails/page.tsx"),
  "Add Communications > Emails route and nav item.",
);
check(
  "All Users uses admin record manager pattern",
  /AdminRecordManager/.test(usersPage),
  "All Users should use the shared admin record manager list/detail UX.",
);
check(
  "All Users includes password reset and direct change tools",
  /sendPortalPasswordReset/.test(usersPage) && /changePortalUserPassword/.test(usersPage),
  "Add admin-only password reset and direct password change actions to All Users.",
);

const failed = checks.filter((item) => !item.ok);

for (const item of checks) {
  console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}`);
  if (!item.ok) console.log(`  ${item.detail}`);
}

if (failed.length) {
  console.error(`\n${failed.length} admin/access/communications validation check(s) failed.`);
  process.exit(1);
}

console.log("\nAdmin access, navigation, users, and communications checks passed.");
