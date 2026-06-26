import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function exists(path) {
  return existsSync(join(root, path));
}

const checks = [];

function check(label, passed) {
  checks.push([label, Boolean(passed)]);
}

const emailConfigPath = "lib/email/config.ts";
const authConfigPath = "lib/auth/urls.ts";
const docsPath = "docs/email-identity-and-auth-branding.md";

const authActions = read("app/portal/actions/auth.ts");
const adminActions = read("app/portal/actions/admin.ts");
const provisioning = read("lib/portal/client-account-provisioning.ts");
const resendProvider = read("lib/email/resend-provider.ts");
const notificationDelivery = read("lib/portal/notification-delivery.ts");
const emailTemplates = read("lib/portal/email-templates.ts");

check("central email config exists", exists(emailConfigPath));
check("auth URL helper exists", exists(authConfigPath));
check("email identity setup doc exists", exists(docsPath));

if (exists(emailConfigPath)) {
  const config = read(emailConfigPath);
  check("config exports AMG_EMAIL_FROM", config.includes("AMG_EMAIL_FROM"));
  check("config exports AMG_OPERATIONS_FROM", config.includes("AMG_OPERATIONS_FROM"));
  check("config exports AMG_REPLY_TO", config.includes("AMG_REPLY_TO"));
  check("config exports SITE_URL", config.includes("SITE_URL"));
  check("config exports PORTAL_URL", config.includes("PORTAL_URL"));
  check("config includes approved sender", config.includes("notify@amgaviationgroup.com"));
  check("config includes operations sender", config.includes("operations@amgaviationgroup.com"));
  check("config includes reply-to address", config.includes("information@amgaviationgroup.com"));
}

if (exists(authConfigPath)) {
  const authConfig = read(authConfigPath);
  check("auth helper builds password setup URL", authConfig.includes("passwordSetupRedirectUrl"));
  check("auth helper builds invite URL", authConfig.includes("portalInviteRedirectUrl"));
  check("auth helper uses AMG auth paths", authConfig.includes("/auth/password-setup") && authConfig.includes("/auth/invite"));
}

check("resend provider uses centralized email config", resendProvider.includes("@/lib/email/config"));
check("notification delivery uses centralized email config", notificationDelivery.includes("@/lib/email/config"));
check("email templates use centralized brand/site config", emailTemplates.includes("@/lib/email/config"));
check("password reset uses branded auth redirect helper", authActions.includes("passwordSetupRedirectUrl()"));
check("admin invites use branded auth redirect helper", adminActions.includes("portalInviteRedirectUrl()"));
check("client provisioning uses branded auth redirect helper", provisioning.includes("passwordSetupRedirectUrl()"));
check("auth actions no longer use VERCEL_URL fallback", !authActions.includes("VERCEL_URL"));
check("admin invite actions no longer use VERCEL_URL fallback", !adminActions.includes("VERCEL_URL"));
check("client provisioning no longer hardcodes amgaviationgroup.com/portal-setup", !provisioning.includes("https://amgaviationgroup.com/portal-setup"));
check("account security copy does not mention Supabase", !read("components/portal/account-security-form.tsx").includes("Supabase"));

if (exists(docsPath)) {
  const docs = read(docsPath);
  check("docs include Supabase SMTP settings", docs.includes("Authentication > SMTP Settings"));
  check("docs include redirect allowlist", docs.includes("Redirect URLs"));
  check("docs include Resend domain verification", docs.includes("Resend domain"));
  check("docs include required env vars", docs.includes("RESEND_API_KEY") && docs.includes("AMG_EMAIL_FROM"));
}

const failures = checks.filter(([, passed]) => !passed);

if (failures.length > 0) {
  console.error("Email identity verification failed:");
  for (const [label] of failures) console.error(`- ${label}`);
  process.exit(1);
}

console.log("Email identity verification passed.");
