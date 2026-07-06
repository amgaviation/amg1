/**
 * Role-permission vocabulary: the module catalog, the action list, and the
 * code-default matrix. Pure data — safe to import from client components,
 * server code, and scripts (no "server-only", no Supabase).
 *
 * Resolution semantics live in lib/portal/permissions.ts: a role_permissions
 * DB row wins, then DEFAULT_PERMISSIONS, then deny. super_admin always passes
 * and is intentionally absent from this file's matrix.
 */

import type { PortalRole } from "@/lib/portal/constants";

export const PERMISSION_ACTIONS = ["view", "add", "edit", "delete"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  add: "Add",
  edit: "Edit",
  delete: "Delete",
};

export type PermissionModule =
  | "missions"
  | "quotes"
  | "invoices"
  | "subscriptions"
  | "expenses"
  | "documents"
  | "messages"
  | "communications"
  | "notifications"
  | "aircraft"
  | "passengers"
  | "clients"
  | "crew"
  | "partners"
  | "users"
  | "crm"
  | "form_submissions"
  | "network_applications"
  | "tasks"
  | "compliance"
  | "audit_log"
  | "financial_analytics"
  | "settings";

export type PermissionKey = `${PermissionModule}.${PermissionAction}`;

/** Roles that appear as editable rows in the matrix. super_admin never does. */
export const MATRIX_ROLES = ["client", "crew", "partner", "admin"] as const;
export type MatrixRole = (typeof MATRIX_ROLES)[number];

export function isMatrixRole(value: unknown): value is MatrixRole {
  return value === "client" || value === "crew" || value === "partner" || value === "admin";
}

export type PermissionModuleInfo = {
  key: PermissionModule;
  label: string;
  description: string;
};

/** Every permission-gated business area of the portal, in display order. */
export const PERMISSION_MODULES: PermissionModuleInfo[] = [
  { key: "missions", label: "Missions & Support Requests", description: "Trips, mission control, calendar, mission lifecycle." },
  { key: "quotes", label: "Quotes", description: "Quote drafting, sending, and client responses." },
  { key: "invoices", label: "Invoices & Payments", description: "Invoices, payments, receivables." },
  { key: "subscriptions", label: "Subscriptions", description: "Plans, member subscriptions, usage and credits." },
  { key: "expenses", label: "Expenses & Receipts", description: "Expense capture, review, and receipts." },
  { key: "documents", label: "Documents", description: "Document vault uploads, review, and sharing." },
  { key: "messages", label: "Messages", description: "Portal message threads." },
  { key: "communications", label: "Email Communications", description: "Communications center and templated email sends." },
  { key: "notifications", label: "Notifications", description: "In-app notification feed." },
  { key: "aircraft", label: "Aircraft", description: "Aircraft records and airworthiness data." },
  { key: "passengers", label: "Passengers", description: "Saved passenger profiles." },
  { key: "clients", label: "Client Directory", description: "Client company and contact records." },
  { key: "crew", label: "Crew Directory & Records", description: "Crew roster, availability, credentials." },
  { key: "partners", label: "Partners & Service Requests", description: "Partner directory, partner workspace, assigned requests." },
  { key: "users", label: "User Management", description: "Approvals, waitlist, roles, account admin." },
  { key: "crm", label: "Sales Pipeline (CRM)", description: "Leads, activities, follow-ups." },
  { key: "form_submissions", label: "Form Submissions", description: "Public website form intake." },
  { key: "network_applications", label: "Network Applications", description: "Crew network applications and review." },
  { key: "tasks", label: "Tasks", description: "Operational task list." },
  { key: "compliance", label: "Compliance & Legal", description: "Consent events, privacy requests, controls." },
  { key: "audit_log", label: "Audit Log", description: "Immutable audit trail (view only by design)." },
  { key: "financial_analytics", label: "Financial Analytics", description: "Revenue and margin reporting." },
  { key: "settings", label: "Portal Settings", description: "Billing settings, email templates, permissions." },
];

export const PERMISSION_MODULE_KEYS: PermissionModule[] = PERMISSION_MODULES.map((m) => m.key);

export function isPermissionModule(value: unknown): value is PermissionModule {
  return PERMISSION_MODULE_KEYS.includes(value as PermissionModule);
}

export type ActionFlags = Record<PermissionAction, boolean>;

const NONE: ActionFlags = { view: false, add: false, edit: false, delete: false };
const V: ActionFlags = { view: true, add: false, edit: false, delete: false };
const VA: ActionFlags = { view: true, add: true, edit: false, delete: false };
const VE: ActionFlags = { view: true, add: false, edit: true, delete: false };
const VAE: ActionFlags = { view: true, add: true, edit: true, delete: false };
const FULL: ActionFlags = { view: true, add: true, edit: true, delete: true };

/**
 * Code defaults = today's behavior, so shipping the matrix changes nothing
 * until an admin edits it. A module absent for a role means deny-all; it is
 * filled in explicitly here so the seed and the matrix UI show every cell.
 * Ownership scoping (own records only) stays inside the actions + RLS.
 */
export const DEFAULT_PERMISSIONS: Record<MatrixRole, Record<PermissionModule, ActionFlags>> = {
  client: {
    missions: VAE,
    quotes: VE,
    invoices: V,
    subscriptions: VAE,
    expenses: NONE,
    documents: VA,
    messages: VA,
    communications: NONE,
    notifications: VE,
    aircraft: VAE,
    passengers: FULL,
    clients: NONE,
    crew: NONE,
    partners: NONE,
    users: NONE,
    crm: NONE,
    form_submissions: NONE,
    network_applications: NONE,
    tasks: NONE,
    compliance: NONE,
    audit_log: NONE,
    financial_analytics: NONE,
    settings: NONE,
  },
  crew: {
    missions: VE,
    quotes: NONE,
    invoices: NONE,
    subscriptions: NONE,
    expenses: FULL,
    documents: VA,
    messages: VA,
    communications: NONE,
    notifications: VE,
    aircraft: NONE,
    passengers: NONE,
    clients: NONE,
    crew: FULL,
    partners: NONE,
    users: NONE,
    crm: NONE,
    form_submissions: NONE,
    network_applications: NONE,
    tasks: NONE,
    compliance: NONE,
    audit_log: NONE,
    financial_analytics: NONE,
    settings: NONE,
  },
  partner: {
    missions: NONE,
    quotes: NONE,
    invoices: NONE,
    subscriptions: NONE,
    expenses: NONE,
    documents: VA,
    messages: VA,
    communications: NONE,
    notifications: VE,
    aircraft: NONE,
    passengers: NONE,
    clients: NONE,
    crew: NONE,
    partners: VAE,
    users: NONE,
    crm: NONE,
    form_submissions: NONE,
    network_applications: NONE,
    tasks: NONE,
    compliance: NONE,
    audit_log: NONE,
    financial_analytics: NONE,
    settings: NONE,
  },
  admin: {
    missions: FULL,
    quotes: FULL,
    invoices: FULL,
    subscriptions: FULL,
    expenses: FULL,
    documents: FULL,
    messages: FULL,
    communications: FULL,
    notifications: FULL,
    aircraft: FULL,
    passengers: FULL,
    clients: FULL,
    crew: FULL,
    partners: FULL,
    users: FULL,
    crm: FULL,
    form_submissions: FULL,
    network_applications: FULL,
    tasks: FULL,
    compliance: FULL,
    audit_log: V,
    financial_analytics: V,
    settings: FULL,
  },
};

export function defaultFlags(role: PortalRole, module: PermissionModule): ActionFlags {
  if (role === "super_admin") return FULL;
  return DEFAULT_PERMISSIONS[role as MatrixRole]?.[module] ?? NONE;
}

export function parsePermissionKey(key: PermissionKey): { module: PermissionModule; action: PermissionAction } {
  const dot = key.lastIndexOf(".");
  return {
    module: key.slice(0, dot) as PermissionModule,
    action: key.slice(dot + 1) as PermissionAction,
  };
}

/**
 * Portal nav → module mapping by route prefix (longest prefix wins). Routes
 * with no entry (dashboards, personal settings, sign-out) are always shown.
 */
export const NAV_MODULE_PREFIXES: [string, PermissionModule][] = [
  ["/portal/admin/mission-control", "missions"],
  ["/portal/admin/trips", "missions"],
  ["/portal/admin/calendar", "missions"],
  ["/portal/admin/missions", "missions"],
  ["/portal/admin/tasks", "tasks"],
  ["/portal/admin/crm", "crm"],
  ["/portal/admin/form-submissions", "form_submissions"],
  ["/portal/admin/network-applications", "network_applications"],
  ["/portal/admin/user-approvals", "users"],
  ["/portal/admin/waitlist", "users"],
  ["/portal/admin/users", "users"],
  ["/portal/admin/clients", "clients"],
  ["/portal/admin/crew", "crew"],
  ["/portal/admin/aircraft", "aircraft"],
  ["/portal/admin/partners", "partners"],
  ["/portal/admin/quotes", "quotes"],
  ["/portal/admin/invoices", "invoices"],
  ["/portal/admin/payments", "invoices"],
  ["/portal/admin/receivables", "invoices"],
  ["/portal/admin/subscriptions", "subscriptions"],
  ["/portal/admin/financial", "financial_analytics"],
  ["/portal/admin/expenses", "expenses"],
  ["/portal/admin/receipts", "expenses"],
  ["/portal/admin/messages", "messages"],
  ["/portal/admin/communications", "communications"],
  ["/portal/admin/notifications", "notifications"],
  ["/portal/admin/documents", "documents"],
  ["/portal/admin/compliance", "compliance"],
  ["/portal/admin/security-review", "compliance"],
  ["/portal/admin/audit-log", "audit_log"],
  ["/portal/admin/settings", "settings"],
  ["/portal/client/trips", "missions"],
  ["/portal/client/aircraft", "aircraft"],
  ["/portal/client/passengers", "passengers"],
  ["/portal/client/quotes", "quotes"],
  ["/portal/client/billing", "invoices"],
  ["/portal/client/subscriptions", "subscriptions"],
  ["/portal/client/documents", "documents"],
  ["/portal/client/messages", "messages"],
  ["/portal/client/notifications", "notifications"],
  ["/portal/crew/missions", "missions"],
  ["/portal/crew/availability", "crew"],
  ["/portal/crew/credentials", "crew"],
  ["/portal/crew/expenses", "expenses"],
  ["/portal/crew/messages", "messages"],
  ["/portal/crew/notifications", "notifications"],
  ["/portal/partner/requests", "partners"],
  ["/portal/partner/profile", "partners"],
  ["/portal/partner/documents", "documents"],
  ["/portal/partner/messages", "messages"],
  ["/portal/partner/notifications", "notifications"],
];

export function navModuleForHref(href: string): PermissionModule | null {
  const path = href.split("?")[0];
  let best: PermissionModule | null = null;
  let bestLen = -1;
  for (const [prefix, module] of NAV_MODULE_PREFIXES) {
    if ((path === prefix || path.startsWith(`${prefix}/`)) && prefix.length > bestLen) {
      best = module;
      bestLen = prefix.length;
    }
  }
  return best;
}
