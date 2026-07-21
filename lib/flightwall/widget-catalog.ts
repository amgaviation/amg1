/**
 * FlightWall widget catalog — every block that can be placed on the wall.
 *
 * Client-safe (imported by the portal layout editor); the actual data
 * queries live server-side in app/api/flightwall/widgets/route.ts. The five
 * BUILTIN keys render their original bespoke panels on the dashboard; the
 * GENERIC entries render as a standard "count + latest rows" panel fed from
 * the portal database.
 */

export type WidgetDef = { key: string; label: string; description: string };

/** Panels with bespoke rendering baked into the dashboard. */
export const BUILTIN_WIDGETS: WidgetDef[] = [
  { key: "map", label: "Traffic Map", description: "Live basemap with ADS-B traffic" },
  { key: "nearby", label: "Nearby Traffic", description: "Closest aircraft list + tracked-flight card" },
  { key: "requests", label: "Latest Requests", description: "New AMG mission requests" },
  { key: "missions", label: "Mission Board", description: "Active mission pipeline" },
  { key: "revenue", label: "Revenue", description: "Today / month-to-date" },
  { key: "metar", label: "METAR Ticker", description: "Weather strip" },
];

/** Generic data widgets — count + latest records from the portal DB. */
export const GENERIC_WIDGETS: WidgetDef[] = [
  { key: "quotes", label: "Quotes", description: "Latest quotes in the pipeline" },
  { key: "invoices", label: "Invoices", description: "Latest invoices" },
  { key: "payments", label: "Payments", description: "Recent payments received" },
  { key: "expenses", label: "Expenses", description: "Latest crew expense submissions" },
  { key: "crew", label: "Crew Roster", description: "Crew profiles, newest first" },
  { key: "crew_availability", label: "Crew Availability", description: "Latest crew availability updates" },
  { key: "aircraft", label: "Fleet", description: "Aircraft on file" },
  { key: "clients", label: "Clients", description: "Client accounts, newest first" },
  { key: "partners", label: "Partners", description: "Partner organizations" },
  { key: "tasks", label: "Ops Tasks", description: "Operations task list" },
  { key: "approvals", label: "Access Requests", description: "Pending portal access requests" },
  { key: "applications", label: "Network Applications", description: "Crew network applications" },
  { key: "notifications", label: "Notifications", description: "Latest portal notifications" },
  { key: "comms", label: "Communications", description: "Latest communication messages" },
  { key: "contact_forms", label: "Contact Forms", description: "Website contact form submissions" },
  { key: "crm_leads", label: "CRM Leads", description: "Sales pipeline leads" },
  { key: "crm_activity", label: "CRM Activity", description: "Latest pipeline activity" },
  { key: "audit", label: "Audit Log", description: "Recent portal actions" },
  { key: "subscriptions", label: "Subscriptions", description: "Client subscriptions" },
  { key: "billing_docs", label: "Billing Documents", description: "Latest billing documents" },
  { key: "calendar", label: "Calendar", description: "Latest calendar events" },
  { key: "documents", label: "Documents", description: "Latest uploaded documents" },
];

export const ALL_WIDGET_KEYS: string[] = [...BUILTIN_WIDGETS, ...GENERIC_WIDGETS].map((w) => w.key);

export const WIDGET_LABELS: Record<string, string> = Object.fromEntries(
  [...BUILTIN_WIDGETS, ...GENERIC_WIDGETS].map((w) => [w.key, w.label])
);
