import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const checks = [
  {
    name: "public request form collects business purpose and does not expose role selection",
    run() {
      const source = read("components/site/portal-login.tsx");
      return (
        source.includes('name="business_purpose"') &&
        source.includes("Business purpose") &&
        source.includes("AMG reviews portal access requests before activation") &&
        !source.includes('name="role" value="client"')
      );
    },
  },
  {
    name: "profile status vocabulary includes operational access states",
    run() {
      const source = read("lib/portal/constants.ts");
      return ["pending_approval", "approved", "denied", "waitlisted", "suspended", "deleted"].every((status) =>
        source.includes(`value: "${status}"`)
      );
    },
  },
  {
    name: "admin shell exposes waitlist under user management",
    run() {
      return read("components/portal/shell/portal-shell.tsx").includes('href: "/portal/admin/waitlist"');
    },
  },
  {
    name: "waitlist admin page exists with approve, deny, email actions",
    run() {
      if (!exists("app/portal/admin/waitlist/page.tsx")) return false;
      const source = read("app/portal/admin/waitlist/page.tsx");
      return ["approveWaitlistedUser", "denyWaitlistedUser", "sendWaitlistContactEmail"].every((name) =>
        source.includes(name)
      );
    },
  },
  {
    name: "waitlist email template is centralized",
    run() {
      if (!exists("lib/email/templates/access-management.ts")) return false;
      const source = read("lib/email/templates/access-management.ts");
      return (
        source.includes("waitlist_contact_request") &&
        source.includes("AMG Portal Access Request") &&
        source.includes("information@amgaviationgroup.com")
      );
    },
  },
  {
    name: "public access submission handles duplicate statuses server-side",
    run() {
      const source = read("app/portal/actions/auth.ts");
      return [
        "Portal access for this email is currently suspended. Please contact AMG Operations for more information.",
        "AMG already has a pending portal access request for this email.",
        "This portal access request is currently under AMG review. Please contact AMG Operations for more information.",
        "An AMG portal account already exists for this email. Please sign in or contact AMG Operations.",
        "status === \"deleted\"",
      ].every((needle) => source.includes(needle));
    },
  },
  {
    name: "delete user is implemented as soft delete",
    run() {
      const source = read("app/portal/actions/admin.ts");
      const fnStart = source.indexOf("export async function deletePortalUser");
      const fnEnd = source.indexOf("export async function createPortalUser", fnStart);
      const fn = source.slice(fnStart, fnEnd);
      return (
        fn.includes('status: "deleted"') &&
        fn.includes("deleted_at") &&
        fn.includes("deleted_by") &&
        fn.includes("is_deleted") &&
        !fn.includes(".delete().eq")
      );
    },
  },
  {
    name: "all users page defaults to approved filter and refreshes dynamically",
    run() {
      const source = read("app/portal/admin/users/page.tsx");
      return (
        source.includes("export const dynamic = \"force-dynamic\"") &&
        source.includes('currentStatus = params.status ?? "approved"') &&
        source.includes("Pending Approval") &&
        source.includes("Deleted")
      );
    },
  },
  {
    name: "access management migration adds fields and audit table",
    run() {
      const migration = fs
        .readdirSync(path.join(root, "supabase/migrations"))
        .filter((file) => file.includes("access_management"))
        .map((file) => read(`supabase/migrations/${file}`))
        .join("\n");
      return (
        migration.includes("business_purpose") &&
        migration.includes("portal_user_status_events") &&
        migration.includes("grant select, insert") &&
        migration.includes("enable row level security")
      );
    },
  },
  {
    name: "profile status default is compatible with approved status vocabulary",
    run() {
      const migration = fs
        .readdirSync(path.join(root, "supabase/migrations"))
        .filter((file) => file.includes("access_management") || file.includes("profiles_status_default"))
        .map((file) => read(`supabase/migrations/${file}`))
        .join("\n");
      return (
        migration.includes("profiles_status_check") &&
        migration.includes("'pending_approval'") &&
        migration.includes("alter column status set default 'pending_approval'")
      );
    },
  },
  {
    name: "profile invitation metadata used by portal actions is migrated",
    run() {
      const migration = fs
        .readdirSync(path.join(root, "supabase/migrations"))
        .filter((file) => file.includes("access_management") || file.includes("profile_invitation_metadata") || file.includes("profiles_invited_by"))
        .map((file) => read(`supabase/migrations/${file}`))
        .join("\n");
      return ["invitation_status", "invitation_channel", "invitation_sent_at", "invited_by"].every((column) =>
        migration.includes(column)
      );
    },
  },
];

const failures = checks.filter((check) => !check.run());

if (failures.length) {
  console.error("Access management verification failed:");
  for (const failure of failures) console.error(`- ${failure.name}`);
  process.exit(1);
}

console.log(`Access management verification passed (${checks.length} checks).`);
