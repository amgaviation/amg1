import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canUsePortalDuringMaintenance,
  canUsePrivateApiDuringMaintenance,
  isEmergencyMaintenanceAdminPath,
  isMaintenanceMode,
  isPublicSignupEnabled,
} from "../lib/portal/maintenance";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

assert.equal(isMaintenanceMode(undefined), true);
assert.equal(isMaintenanceMode("true"), true);
assert.equal(isMaintenanceMode("FALSE"), true);
assert.equal(isMaintenanceMode("false"), false);
assert.equal(isPublicSignupEnabled(undefined), false);
assert.equal(isPublicSignupEnabled("true"), false);
assert.equal(isPublicSignupEnabled("enabled"), true);

assert.equal(isEmergencyMaintenanceAdminPath("/portal/admin"), true);
assert.equal(isEmergencyMaintenanceAdminPath("/portal/admin/security"), true);
assert.equal(isEmergencyMaintenanceAdminPath("/portal/super-admin"), true);
assert.equal(isEmergencyMaintenanceAdminPath("/portal/super-admin/settings"), true);
assert.equal(isEmergencyMaintenanceAdminPath("/portal/administer"), false);
assert.equal(isEmergencyMaintenanceAdminPath("/portal/client"), false);

const approvedAdmin = {
  role: "admin",
  status: "approved",
  is_active: true,
  is_deleted: false,
};
assert.equal(canUsePortalDuringMaintenance(approvedAdmin, "/portal/admin"), true);
assert.equal(canUsePortalDuringMaintenance({ ...approvedAdmin, role: "super_admin" }, "/portal/super-admin"), true);
assert.equal(canUsePortalDuringMaintenance({ ...approvedAdmin, role: "client" }, "/portal/admin"), false);
assert.equal(canUsePortalDuringMaintenance({ ...approvedAdmin, status: "suspended" }, "/portal/admin"), false);
assert.equal(canUsePortalDuringMaintenance({ ...approvedAdmin, is_active: false }, "/portal/admin"), false);
assert.equal(canUsePortalDuringMaintenance({ ...approvedAdmin, is_active: null }, "/portal/admin"), false);
assert.equal(canUsePortalDuringMaintenance({ ...approvedAdmin, is_deleted: true }, "/portal/admin"), false);
assert.equal(canUsePortalDuringMaintenance(approvedAdmin, "/portal/client"), false);
assert.equal(canUsePortalDuringMaintenance(null, "/portal/admin"), false);
assert.equal(canUsePrivateApiDuringMaintenance(approvedAdmin), true);
assert.equal(canUsePrivateApiDuringMaintenance({ ...approvedAdmin, role: "client" }), false);
assert.equal(canUsePrivateApiDuringMaintenance({ ...approvedAdmin, is_active: false }), false);

const auth = read("app/portal/actions/auth.ts");
assert.doesNotMatch(auth, /user_metadata\?\.role/);
assert.match(auth, /const role: PortalRole = "client"/);
assert.match(auth, /isPublicSignupEnabled\(process\.env\.AMG_CONNECT_PUBLIC_SIGNUP\)/);

const loginPage = read("app/(public)/login/page.tsx");
const loginUi = read("components/site/portal-login.tsx");
assert.match(loginPage, /params\.mode === "request" && !publicSignupEnabled/);
assert.match(loginUi, /publicSignupEnabled \? initialMode : "signin"/);

const session = read("lib/portal/session.ts");
assert.match(session, /return user\.status === "approved" && user\.isActive && !user\.isDeleted/);
assert.match(session, /if \(isApprovedSessionUser\(user\)\) return user/);
assert.match(session, /redirect\("\/pending-approval"\)/);

const middleware = read("proxy.ts");
assert.match(middleware, /canUsePortalDuringMaintenance/);
assert.match(middleware, /redirectWithCookies\(request, supabaseResponse, "\/maintenance"\)/);
assert.match(middleware, /"\/api\/portal\/:path\*"/);
assert.match(middleware, /canUsePrivateApiDuringMaintenance/);

const apiGuard = read("lib/portal/api-guard.ts");
const actionHelpers = read("app/portal/actions/_helpers.ts");
assert.match(apiGuard, /isApprovedSessionUser\(user\)/);
assert.match(apiGuard, /isMaintenanceMode/);
assert.match(actionHelpers, /const user = await requireUser\(\)/);

const stripe = read("lib/portal/stripe-invoices.ts");
assert.match(stripe, /rpc\("record_stripe_invoice_payment"/);
assert.match(stripe, /idempotencyKey: invoiceCheckoutIdempotencyKey/);
assert.doesNotMatch(stripe, /nextBillingDocumentNumber/);

const migration = read("supabase/migrations/20260710014402_full_security_remediation.sql");
const searchPathMigration = read("supabase/migrations/20260710021000_function_search_path_hardening.sql");
assert.match(migration, /drop policy if exists "documents_select" on storage\.objects/i);
assert.match(migration, /drop policy if exists "crew_cred_upload" on storage\.objects/i);
assert.match(migration, /drop policy if exists "communication attachments admin read storage" on storage\.objects/i);
assert.match(migration, /drop policy if exists "communication attachments admin write storage" on storage\.objects/i);
assert.match(migration, /drop policy if exists "network application files admin read storage" on storage\.objects/i);
assert.match(migration, /update storage\.buckets[\s\S]*set public = false/i);
assert.match(migration, /create or replace function public\.handle_new_user\(\)/i);
assert.match(migration, /'client'/i);
assert.match(migration, /create or replace function public\.record_stripe_invoice_payment/i);
assert.match(migration, /create or replace function public\.update_stripe_invoice_event_status/i);
assert.match(migration, /create unique index if not exists payments_provider_checkout_session_id_uidx/i);
assert.match(migration, /create unique index if not exists payments_provider_payment_id_uidx/i);
assert.match(migration, /security invoker/i);
assert.match(migration, /for update/i);
assert.match(migration, /v_invoice\.status not in \('sent', 'viewed', 'overdue', 'partially_paid'\)/i);
assert.match(migration, /'outcome', 'reconciliation_required'/i);
assert.match(migration, /revoke all on function public\.record_stripe_invoice_payment/i);
assert.match(migration, /grant execute on function public\.record_stripe_invoice_payment[\s\S]*service_role/i);
assert.match(migration, /grant execute on function public\.next_billing_document_number\(text\) to service_role/i);
assert.match(migration, /grant execute on function public\.update_stripe_invoice_event_status[\s\S]*to service_role/i);
assert.match(migration, /drop function if exists public\.approve_access_request/i);
assert.match(migration, /create policy profiles_select_self_or_admin[\s\S]*to authenticated/i);
assert.match(migration, /revoke execute on all functions in schema public from public, anon, authenticated/i);
assert.match(migration, /alter default privileges for role postgres in schema public\s+revoke all on sequences from public, anon, authenticated/i);
assert.match(migration, /grant execute on function public\.rpc_map_admin[\s\S]*to authenticated/i);
assert.doesNotMatch(migration, /for\s+function_record\s+in[\s\S]*security definer/i);
assert.match(searchPathMigration, /alter function public\.next_billing_document_number\(text\) set search_path = ''/i);
assert.match(searchPathMigration, /alter function public\.sync_access_request_status\(\) set search_path = ''/i);

const packageJson = read("package.json");
assert.doesNotMatch(packageJson, /"xlsx"\s*:\s*"\^0\.18\.5"/);
assert.match(packageJson, /xlsx-0\.20\.3\.tgz/);

const networkConstants = read("lib/portal/network-application-constants.ts");
const networkImporter = read("lib/portal/network-applications.ts");
const networkImportUi = read("components/portal/admin/network-prospect-tools.tsx");
assert.match(networkConstants, /NETWORK_PROSPECT_IMPORT_MAX_FILE_BYTES = 8 \* 1024 \* 1024/);
assert.match(networkConstants, /NETWORK_PROSPECT_IMPORT_MAX_ROWS = 2000/);
assert.match(networkImporter, /input\.rows\.length > NETWORK_PROSPECT_IMPORT_MAX_ROWS/);
assert.match(networkImportUi, /file\.size > NETWORK_PROSPECT_IMPORT_MAX_FILE_BYTES/);
assert.match(networkImportUi, /matrix\.length - 1\) > NETWORK_PROSPECT_IMPORT_MAX_ROWS/);
assert.match(networkImportUi, /sheetRows: NETWORK_PROSPECT_IMPORT_MAX_ROWS \+ 2/);

const crmImportUi = read("components/portal/admin/crm-lead-import-export.tsx");
assert.match(crmImportUi, /sheetRows: MAX_IMPORT_ROWS \+ 12/);

const nextConfig = read("next.config.ts");
assert.doesNotMatch(nextConfig, /ignoreBuildErrors:\s*true/);

console.log("Full security remediation verification passed.");
