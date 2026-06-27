/**
 * Central vocabulary for the AMG operations portal: roles, navigation,
 * and the status/label/tone maps shared across every portal surface.
 */

export type PortalRole = "client" | "crew" | "admin" | "partner" | "super_admin";

export type Tone =
  | "neutral"
  | "info"
  | "warn"
  | "success"
  | "danger"
  | "accent";

export const PORTAL_ROLES: PortalRole[] = ["client", "crew", "admin", "partner"];
export const SUPER_ADMIN_ROLE: PortalRole = "super_admin";

export function isPortalRole(value: unknown): value is PortalRole {
  return (
    value === "client" ||
    value === "crew" ||
    value === "admin" ||
    value === "partner" ||
    value === "super_admin"
  );
}

export function isAdminRole(value: unknown): value is "admin" | "super_admin" {
  return value === "admin" || value === "super_admin";
}

export const ROLE_LABELS: Record<PortalRole, string> = {
  client: "Client Portal",
  crew: "Crew Portal",
  admin: "Operations Command",
  partner: "Partner Portal",
  super_admin: "Super Admin Console",
};

export const ROLE_SHORT: Record<PortalRole, string> = {
  client: "Owner Services",
  crew: "Flight Crew",
  admin: "AMG Operations",
  partner: "Service Partner",
  super_admin: "Website Governance",
};

export const ROLE_HOME: Record<PortalRole, string> = {
  client: "/portal/client/dashboard",
  crew: "/portal/crew/dashboard",
  admin: "/portal/admin/dashboard",
  partner: "/portal/partner/dashboard",
  super_admin: "/portal/super-admin/website-editor",
};

export type NavItem = { label: string; href: string; icon: string };

export const PORTAL_NAV: Record<PortalRole, NavItem[]> = {
  client: [
    { label: "Overview", href: "/portal/client/dashboard", icon: "gauge" },
    { label: "Support Requests", href: "/portal/client/trips", icon: "plane" },
    { label: "New Request", href: "/portal/client/trips/new", icon: "plus" },
    { label: "Aircraft", href: "/portal/client/aircraft", icon: "planeTakeoff" },
    { label: "Documents", href: "/portal/client/documents", icon: "fileText" },
    { label: "Quotes", href: "/portal/client/quotes", icon: "receipt" },
    { label: "Invoices", href: "/portal/client/billing", icon: "wallet" },
    { label: "Subscriptions", href: "/portal/client/subscriptions", icon: "clipboard" },
    { label: "Messages", href: "/portal/client/messages", icon: "messageSquare" },
    { label: "Notifications", href: "/portal/client/notifications", icon: "bell" },
    { label: "Settings", href: "/portal/client/settings", icon: "settings" },
  ],
  crew: [
    { label: "Overview", href: "/portal/crew/dashboard", icon: "gauge" },
    { label: "Open Assignments", href: "/portal/crew/missions?pool=open", icon: "radar" },
    { label: "My Assignments", href: "/portal/crew/missions", icon: "plane" },
    { label: "Availability", href: "/portal/crew/availability", icon: "calendar" },
    { label: "Credentials", href: "/portal/crew/credentials", icon: "badgeCheck" },
    { label: "Expenses", href: "/portal/crew/expenses", icon: "receipt" },
    { label: "Messages", href: "/portal/crew/messages", icon: "messageSquare" },
    { label: "Notifications", href: "/portal/crew/notifications", icon: "bell" },
    { label: "Settings", href: "/portal/crew/settings", icon: "settings" },
  ],
  admin: [
    { label: "Overview", href: "/portal/admin/dashboard", icon: "gauge" },
    { label: "Mission Control", href: "/portal/admin/mission-control", icon: "radar" },
    { label: "Support Requests", href: "/portal/admin/trips", icon: "plane" },
    { label: "Form Submissions", href: "/portal/admin/form-submissions", icon: "clipboard" },
    { label: "Clients", href: "/portal/admin/clients", icon: "building" },
    { label: "Crew", href: "/portal/admin/crew", icon: "users" },
    { label: "Aircraft", href: "/portal/admin/aircraft", icon: "planeTakeoff" },
    { label: "Partners", href: "/portal/admin/partners", icon: "handshake" },
    { label: "Messages", href: "/portal/admin/messages", icon: "messageSquare" },
    { label: "Emails", href: "/portal/admin/communications/emails", icon: "messageSquare" },
    { label: "Quotes", href: "/portal/admin/quotes", icon: "receipt" },
    { label: "Invoices", href: "/portal/admin/invoices", icon: "wallet" },
    { label: "Subscriptions", href: "/portal/admin/subscriptions", icon: "clipboard" },
    { label: "Documents", href: "/portal/admin/documents", icon: "fileText" },
    { label: "Expenses", href: "/portal/admin/expenses", icon: "wallet" },
    { label: "Compliance", href: "/portal/admin/compliance", icon: "shield" },
    { label: "Security Review", href: "/portal/admin/security-review", icon: "shield" },
    { label: "User Approvals", href: "/portal/admin/user-approvals", icon: "userCheck" },
    { label: "All Users", href: "/portal/admin/users", icon: "userCheck" },
    { label: "Audit Log", href: "/portal/admin/audit-log", icon: "history" },
    { label: "System Health", href: "/portal/admin/system-health", icon: "shield" },
    { label: "Settings", href: "/portal/admin/settings", icon: "settings" },
  ],
  partner: [
    { label: "Dashboard", href: "/portal/partner/dashboard", icon: "gauge" },
    { label: "Service Requests", href: "/portal/partner/requests", icon: "clipboard" },
    { label: "Company Profile", href: "/portal/partner/profile", icon: "building" },
    { label: "Documents", href: "/portal/partner/documents", icon: "fileText" },
    { label: "Messages", href: "/portal/partner/messages", icon: "messageSquare" },
    { label: "Settings", href: "/portal/partner/settings", icon: "settings" },
  ],
  super_admin: [
    { label: "Website Editor", href: "/portal/super-admin/website-editor", icon: "fileText" },
    { label: "Preview History", href: "/portal/super-admin/website-editor?panel=history", icon: "history" },
    { label: "Operations Admin", href: "/portal/admin/dashboard", icon: "shield" },
    { label: "Settings", href: "/portal/admin/settings", icon: "settings" },
  ],
};

type Choice = { value: string; label: string; tone?: Tone };

function buildLabelMap(choices: Choice[]): Record<string, string> {
  return Object.fromEntries(choices.map((c) => [c.value, c.label]));
}
function buildToneMap(choices: Choice[]): Record<string, Tone> {
  return Object.fromEntries(choices.map((c) => [c.value, c.tone ?? "neutral"]));
}

// ─── Mission lifecycle ──────────────────────────────────────────────
export const MISSION_STATUS: Choice[] = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "submitted", label: "New", tone: "info" },
  { value: "under_review", label: "Under Review", tone: "info" },
  { value: "awaiting_client_info", label: "Awaiting Client Info", tone: "warn" },
  { value: "quoted", label: "Quoted", tone: "accent" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "crew_assigned", label: "Crew Assigned", tone: "accent" },
  { value: "scheduled", label: "Scheduled", tone: "info" },
  { value: "in_progress", label: "In Progress", tone: "accent" },
  { value: "completed", label: "Completed", tone: "success" },
  { value: "cancelled", label: "Cancelled", tone: "danger" },
];
export const MISSION_STATUS_LABEL = buildLabelMap(MISSION_STATUS);
export const MISSION_STATUS_TONE = buildToneMap(MISSION_STATUS);
/** Ordered columns for the admin mission-control board. */
export const MISSION_BOARD_COLUMNS = MISSION_STATUS.map((s) => s.value).filter(
  (v) => v !== "draft"
);

export const MISSION_TYPE: Choice[] = [
  { value: "passenger_trip", label: "Passenger Trip" },
  { value: "owner_trip", label: "Owner Trip" },
  { value: "crew_reposition", label: "Crew Reposition" },
  { value: "ferry", label: "Ferry Flight" },
  { value: "maintenance_reposition", label: "Maintenance Reposition" },
  { value: "aircraft_support", label: "Aircraft Support" },
];
export const MISSION_TYPE_LABEL = buildLabelMap(MISSION_TYPE);

export const URGENCY: Choice[] = [
  { value: "standard", label: "Standard", tone: "neutral" },
  { value: "priority", label: "Priority", tone: "warn" },
  { value: "aog", label: "AOG / Urgent", tone: "danger" },
];
export const URGENCY_LABEL = buildLabelMap(URGENCY);
export const URGENCY_TONE = buildToneMap(URGENCY);

// ─── Crew + assignment ──────────────────────────────────────────────
export const CREW_ASSIGNMENT_STATUS: Choice[] = [
  { value: "offered", label: "Offered", tone: "warn" },
  { value: "accepted", label: "Accepted", tone: "success" },
  { value: "declined", label: "Declined", tone: "danger" },
  { value: "removed", label: "Removed", tone: "neutral" },
  { value: "completed", label: "Completed", tone: "success" },
];
export const CREW_ASSIGNMENT_STATUS_LABEL = buildLabelMap(CREW_ASSIGNMENT_STATUS);
export const CREW_ASSIGNMENT_STATUS_TONE = buildToneMap(CREW_ASSIGNMENT_STATUS);

export const CREW_ROLE: Choice[] = [
  { value: "pic", label: "PIC" },
  { value: "sic", label: "SIC" },
  { value: "pilot", label: "Pilot" },
  { value: "support", label: "Support" },
];
export const CREW_ROLE_LABEL = buildLabelMap(CREW_ROLE);

export const AVAILABILITY_STATUS: Choice[] = [
  { value: "available", label: "Available", tone: "success" },
  { value: "limited", label: "Limited", tone: "warn" },
  { value: "unavailable", label: "Unavailable", tone: "danger" },
];
export const AVAILABILITY_STATUS_LABEL = buildLabelMap(AVAILABILITY_STATUS);
export const AVAILABILITY_STATUS_TONE = buildToneMap(AVAILABILITY_STATUS);

export const CREDENTIAL_STATUS: Choice[] = [
  { value: "not_uploaded", label: "Not Uploaded", tone: "neutral" },
  { value: "pending_review", label: "Pending Review", tone: "info" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "rejected", label: "Rejected", tone: "danger" },
  { value: "expiring", label: "Expiring Soon", tone: "warn" },
  { value: "expired", label: "Expired", tone: "danger" },
];
export const CREDENTIAL_STATUS_LABEL = buildLabelMap(CREDENTIAL_STATUS);
export const CREDENTIAL_STATUS_TONE = buildToneMap(CREDENTIAL_STATUS);

export const CREDENTIAL_TYPES = [
  "ATP Certificate",
  "Commercial Certificate",
  "First Class Medical",
  "Second Class Medical",
  "Passport",
  "Driver License",
  "FCC Radio Permit",
  "Type Rating",
  "Recurrent Training",
  "Insurance Approval",
  "Resume",
  "W-9",
];

// ─── Partner ────────────────────────────────────────────────────────
export const PARTNER_STATUS: Choice[] = [
  { value: "assigned", label: "Assigned", tone: "info" },
  { value: "accepted", label: "Accepted", tone: "success" },
  { value: "declined", label: "Declined", tone: "danger" },
  { value: "quoted", label: "Quote Submitted", tone: "accent" },
  { value: "in_progress", label: "In Progress", tone: "accent" },
  { value: "completed", label: "Completed", tone: "success" },
  { value: "cancelled", label: "Cancelled", tone: "neutral" },
];
export const PARTNER_STATUS_LABEL = buildLabelMap(PARTNER_STATUS);
export const PARTNER_STATUS_TONE = buildToneMap(PARTNER_STATUS);

export const PARTNER_TYPES = [
  "FBO",
  "Maintenance Facility",
  "Ground Transportation",
  "Catering",
  "Aircraft Detailing",
  "Fuel Provider",
  "Hangar Provider",
  "Parts Vendor",
  "Pilot Services",
  "Other",
];

// ─── Subscriptions ─────────────────────────────────────────────────
export const SUBSCRIPTION_STATUS: Choice[] = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "pending_checkout", label: "Pending Checkout", tone: "warn" },
  { value: "trialing", label: "Trialing", tone: "accent" },
  { value: "active", label: "Active", tone: "success" },
  { value: "paused", label: "Paused", tone: "warn" },
  { value: "past_due", label: "Past Due", tone: "danger" },
  { value: "unpaid", label: "Unpaid", tone: "danger" },
  { value: "canceled", label: "Canceled", tone: "neutral" },
  { value: "cancelled", label: "Cancelled", tone: "neutral" },
  { value: "incomplete", label: "Incomplete", tone: "warn" },
  { value: "incomplete_expired", label: "Incomplete Expired", tone: "danger" },
  { value: "expired", label: "Expired", tone: "danger" },
  { value: "renewal_pending", label: "Renewal Pending", tone: "warn" },
  { value: "needs_review", label: "Needs Review", tone: "danger" },
  { value: "sync_error", label: "Sync Error", tone: "danger" },
];
export const SUBSCRIPTION_STATUS_LABEL = buildLabelMap(SUBSCRIPTION_STATUS);
export const SUBSCRIPTION_STATUS_TONE = buildToneMap(SUBSCRIPTION_STATUS);

export const SUBSCRIPTION_SYNC_STATUS: Choice[] = [
  { value: "manual", label: "Manual", tone: "neutral" },
  { value: "pending_checkout", label: "Pending Checkout", tone: "warn" },
  { value: "webhook_pending", label: "Webhook Pending", tone: "warn" },
  { value: "synced", label: "Synced", tone: "success" },
  { value: "needs_review", label: "Needs Review", tone: "danger" },
  { value: "sync_error", label: "Sync Error", tone: "danger" },
  { value: "price_mismatch", label: "Price Mismatch", tone: "danger" },
  { value: "disconnected", label: "Disconnected", tone: "danger" },
  { value: "stale", label: "Stale", tone: "warn" },
  { value: "ignored", label: "Ignored", tone: "neutral" },
];
export const SUBSCRIPTION_SYNC_STATUS_LABEL = buildLabelMap(SUBSCRIPTION_SYNC_STATUS);
export const SUBSCRIPTION_SYNC_STATUS_TONE = buildToneMap(SUBSCRIPTION_SYNC_STATUS);

export const SUBSCRIPTION_PLAN_STATUS: Choice[] = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "active", label: "Active", tone: "success" },
  { value: "archived", label: "Archived", tone: "neutral" },
];
export const SUBSCRIPTION_PLAN_STATUS_LABEL = buildLabelMap(SUBSCRIPTION_PLAN_STATUS);
export const SUBSCRIPTION_PLAN_STATUS_TONE = buildToneMap(SUBSCRIPTION_PLAN_STATUS);

export const SUBSCRIPTION_USAGE_TYPES: Choice[] = [
  { value: "flight_support", label: "Flight Support" },
  { value: "mx_reposition", label: "MX Reposition" },
  { value: "crew_day", label: "Crew Day" },
  { value: "lodging", label: "Lodging" },
  { value: "travel", label: "Travel" },
  { value: "admin_support", label: "Admin Support" },
  { value: "other", label: "Other" },
];
export const SUBSCRIPTION_USAGE_TYPE_LABEL = buildLabelMap(SUBSCRIPTION_USAGE_TYPES);

export const SUBSCRIPTION_CREDIT_TYPES: Choice[] = [
  { value: "rollover", label: "Rollover" },
  { value: "manual", label: "Manual" },
  { value: "refund", label: "Refund" },
  { value: "unused_allowance", label: "Unused Allowance" },
  { value: "adjustment", label: "Adjustment" },
];

// ─── Quotes + expenses ──────────────────────────────────────────────
export const QUOTE_STATUS: Choice[] = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "internal_review", label: "Internal Review", tone: "warn" },
  { value: "sent", label: "Sent", tone: "info" },
  { value: "viewed", label: "Viewed", tone: "accent" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "rejected", label: "Rejected", tone: "danger" },
  { value: "revision_requested", label: "Revision Requested", tone: "warn" },
  { value: "expired", label: "Expired", tone: "danger" },
  { value: "converted", label: "Converted", tone: "success" },
  { value: "void", label: "Void", tone: "neutral" },
  { value: "cancelled", label: "Cancelled", tone: "neutral" },
];
export const QUOTE_STATUS_LABEL = buildLabelMap(QUOTE_STATUS);
export const QUOTE_STATUS_TONE = buildToneMap(QUOTE_STATUS);

export const QUOTE_CATEGORIES = [
  "Crew Services",
  "Crew Travel & Lodging",
  "Aircraft Ferry / Repositioning",
  "Maintenance Support",
  "Owner / Client Coordination",
  "Vendor / FBO / Third-Party Costs",
  "After-Hours / Priority Support",
  "Administrative / Subscription / Program Fees",
  "Pass-Through Expenses",
  "Other",
];

export const BILLING_COST_TYPES = [
  "Fixed Fee",
  "Estimated Allowance",
  "Pass-Through Actual",
  "Pass-Through + Markup",
  "Included / No Charge",
  "TBD",
];

export const PAYMENT_METHODS = [
  { value: "wire", label: "Wire" },
  { value: "zelle", label: "Zelle" },
  { value: "card", label: "Card" },
  { value: "ach", label: "ACH" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
  { value: "manual", label: "Manual" },
];

export const PDF_TEMPLATES = [
  { value: "standard", label: "Standard" },
  { value: "detailed_operations", label: "Detailed Operations" },
  { value: "summary_only", label: "Summary Only" },
  { value: "deposit_request", label: "Deposit Request" },
  { value: "final_invoice", label: "Final Invoice" },
  { value: "paid_receipt", label: "Paid Receipt" },
];

export const EXPENSE_STATUS: Choice[] = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "submitted", label: "Submitted", tone: "info" },
  { value: "under_review", label: "Under Review", tone: "warn" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "partially_approved", label: "Partially Approved", tone: "warn" },
  { value: "rejected", label: "Rejected", tone: "danger" },
  { value: "added_to_quote", label: "Added To Quote", tone: "accent" },
  { value: "added_to_invoice", label: "Added To Invoice", tone: "accent" },
  { value: "reimbursed", label: "Reimbursed", tone: "success" },
  { value: "paid", label: "Paid", tone: "accent" },
];
export const EXPENSE_STATUS_LABEL = buildLabelMap(EXPENSE_STATUS);
export const EXPENSE_STATUS_TONE = buildToneMap(EXPENSE_STATUS);

export const EXPENSE_CATEGORIES: Choice[] = [
  { value: "airline", label: "Airline" },
  { value: "hotel", label: "Hotel" },
  { value: "rental_car", label: "Rental Car" },
  { value: "rideshare", label: "Rideshare" },
  { value: "fuel", label: "Fuel" },
  { value: "meals", label: "Meals" },
  { value: "parking", label: "Parking" },
  { value: "other", label: "Other" },
];
export const EXPENSE_CATEGORY_LABEL = buildLabelMap(EXPENSE_CATEGORIES);

export const INVOICE_STATUS: Choice[] = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "ready_to_send", label: "Ready to Send", tone: "warn" },
  { value: "sent", label: "Sent", tone: "info" },
  { value: "viewed", label: "Viewed", tone: "accent" },
  { value: "partially_paid", label: "Partially Paid", tone: "warn" },
  { value: "paid", label: "Paid", tone: "success" },
  { value: "overdue", label: "Overdue", tone: "danger" },
  { value: "void", label: "Void", tone: "neutral" },
  { value: "written_off", label: "Written Off", tone: "neutral" },
  { value: "refunded", label: "Refunded", tone: "neutral" },
];
export const INVOICE_STATUS_LABEL = buildLabelMap(INVOICE_STATUS);
export const INVOICE_STATUS_TONE = buildToneMap(INVOICE_STATUS);

// ─── Documents ──────────────────────────────────────────────────────
export const DOCUMENT_STATUS: Choice[] = [
  { value: "pending_review", label: "Pending Review", tone: "info" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "rejected", label: "Rejected", tone: "danger" },
  { value: "expiring", label: "Expiring", tone: "warn" },
  { value: "expired", label: "Expired", tone: "danger" },
];
export const DOCUMENT_STATUS_LABEL = buildLabelMap(DOCUMENT_STATUS);
export const DOCUMENT_STATUS_TONE = buildToneMap(DOCUMENT_STATUS);

export const DOCUMENT_TYPES = [
  "Registration",
  "Airworthiness Certificate",
  "Insurance",
  "Weight and Balance",
  "Operating Handbook",
  "Maintenance Tracking",
  "MEL",
  "Letter of Authorization",
  "International Documents",
  "Invoice",
  "Vendor Agreement",
  "Other",
];

export const DOCUMENT_VISIBILITY: Choice[] = [
  { value: "owner", label: "Owner visible" },
  { value: "crew", label: "Crew visible" },
  { value: "partner", label: "Partner visible" },
  { value: "admin", label: "Admin only" },
  { value: "public", label: "Public" },
];
export const DOCUMENT_VISIBILITY_LABEL = buildLabelMap(DOCUMENT_VISIBILITY);

// ─── Profile / account status ───────────────────────────────────────
export const PROFILE_STATUS: Choice[] = [
  { value: "pending", label: "Pending", tone: "warn" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "suspended", label: "Suspended", tone: "danger" },
];
export const PROFILE_STATUS_LABEL = buildLabelMap(PROFILE_STATUS);
export const PROFILE_STATUS_TONE = buildToneMap(PROFILE_STATUS);

/** Roles that may be self-selected when requesting access (admin is internal-only). */
export const REQUESTABLE_ROLES: { value: PortalRole; label: string }[] = [
  { value: "client", label: "Client / Owner Representative" },
  { value: "crew", label: "Crew / Pilot" },
  { value: "partner", label: "Partner / Vendor" },
];

export const PORTAL_PERMISSIONS = [
  "users.manage",
  "aircraft.manage",
  "missions.manage",
  "crew.assign",
  "quotes.manage",
  "invoices.manage",
  "expenses.approve",
  "documents.review",
  "partners.manage",
  "notifications.manage",
  "settings.manage",
  "audit.view",
];

export function labelFor(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return "—";
  return map[value] ?? value;
}
export function toneFor(map: Record<string, Tone>, value: string | null | undefined): Tone {
  if (!value) return "neutral";
  return map[value] ?? "neutral";
}
