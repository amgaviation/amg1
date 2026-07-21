import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hasFlightwallDashboardAccess } from "@/lib/flightwall/access";
import { GENERIC_WIDGETS } from "@/lib/flightwall/widget-catalog";

export const dynamic = "force-dynamic";

/**
 * FlightWall generic widget feed — count + latest rows for any widget the
 * admin placed on the wall via the layout editor. Same gate as the dashboard
 * (trusted IP or admin session). Every widget is aggregated defensively: a
 * failing table yields null for that widget only, never a 500. Labels are
 * truncated server-side (this feed hangs on a wall).
 */

const MAX_LABEL = 30;
const ROW_LIMIT = 4;
const CACHE_TTL_MS = 15_000;
const NO_STORE = { "Cache-Control": "no-store, private" } as const;

type WidgetConfig = {
  table: string;
  /** optional equality filter, e.g. clients = profiles where role=client */
  eq?: [string, string];
  /** order column (defaults to created_at) */
  orderBy?: string;
};

// Server-side query config per catalog key (tables verified against the
// live schema). Kept minimal on purpose: the executor picks display fields
// heuristically so schema drift degrades labels, not the widget.
const WIDGET_CONFIG: Record<string, WidgetConfig> = {
  quotes: { table: "quotes" },
  invoices: { table: "invoices" },
  payments: { table: "payments" },
  expenses: { table: "expenses" },
  crew: { table: "crew_profiles" },
  crew_availability: { table: "crew_availability" },
  aircraft: { table: "aircraft" },
  clients: { table: "profiles", eq: ["role", "client"] },
  partners: { table: "partner_profiles" },
  tasks: { table: "ops_tasks" },
  approvals: { table: "access_requests" },
  applications: { table: "network_applications" },
  notifications: { table: "notifications" },
  comms: { table: "communication_messages" },
  contact_forms: { table: "contact_form_submissions" },
  crm_leads: { table: "crm_leads" },
  crm_activity: { table: "crm_activities" },
  audit: { table: "audit_events" },
  subscriptions: { table: "client_subscriptions" },
  billing_docs: { table: "billing_documents" },
  calendar: { table: "calendar_events" },
  documents: { table: "documents" },
};

const KNOWN_KEYS = new Set(GENERIC_WIDGETS.map((w) => w.key));

const LABEL_CANDIDATES = [
  "title", "name", "full_name", "display_name", "subject", "company", "company_name",
  "tail_number", "registration", "tail", "reference", "ref", "quote_number",
  "invoice_number", "document_number", "action", "activity_type", "file_name",
  "email", "label", "summary", "type", "status",
];
const MONEY_CANDIDATES = ["total_cents", "amount_cents", "amount_total_cents", "total_amount_cents"];

function truncate(v: string): string {
  return v.length > MAX_LABEL ? v.slice(0, MAX_LABEL - 1) + "…" : v;
}

function rowLabel(row: Record<string, unknown>): string {
  for (const key of LABEL_CANDIDATES) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return truncate(v.trim());
  }
  return "—";
}

function rowSub(row: Record<string, unknown>): string {
  const parts: string[] = [];
  const status = row["status"];
  if (typeof status === "string" && status.trim()) parts.push(status.replace(/_/g, " "));
  for (const key of MONEY_CANDIDATES) {
    const v = row[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      parts.push("$" + Math.round(v / 100).toLocaleString("en-US"));
      break;
    }
  }
  const created = row["created_at"];
  if (typeof created === "string") {
    const ageMin = Math.max(0, Math.round((Date.now() - new Date(created).getTime()) / 60000));
    parts.push(ageMin < 60 ? `${ageMin}m` : ageMin < 60 * 48 ? `${Math.round(ageMin / 60)}h` : `${Math.round(ageMin / 1440)}d`);
  }
  return parts.join(" · ");
}

type WidgetData = { count: number | null; rows: { label: string; sub: string }[] };

async function loadWidget(supabase: any, key: string): Promise<WidgetData | null> {
  const cfg = WIDGET_CONFIG[key];
  if (!cfg) return null;
  try {
    let countQ = supabase.from(cfg.table).select("*", { count: "exact", head: true });
    if (cfg.eq) countQ = countQ.eq(cfg.eq[0], cfg.eq[1]);
    const { count, error: countErr } = await countQ;
    if (countErr) throw countErr;

    let rowsQ = supabase.from(cfg.table).select("*").order(cfg.orderBy ?? "created_at", { ascending: false }).limit(ROW_LIMIT);
    if (cfg.eq) rowsQ = rowsQ.eq(cfg.eq[0], cfg.eq[1]);
    const { data, error: rowsErr } = await rowsQ;
    if (rowsErr) throw rowsErr;

    return {
      count: typeof count === "number" ? count : null,
      rows: (data ?? []).map((row: Record<string, unknown>) => ({ label: rowLabel(row), sub: rowSub(row) })),
    };
  } catch (error) {
    console.error(`[flightwall] widget ${key} failed`, error);
    return null;
  }
}

let cache: { at: number; key: string; body: Record<string, WidgetData | null> } | null = null;

export async function GET(request: Request) {
  if (!(await hasFlightwallDashboardAccess())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const url = new URL(request.url);
  const keys = Array.from(
    new Set(
      (url.searchParams.get("keys") ?? "")
        .split(",")
        .map((k) => k.trim())
        .filter((k) => KNOWN_KEYS.has(k))
    )
  ).slice(0, 24);
  if (keys.length === 0) {
    return NextResponse.json({ widgets: {} }, { headers: NO_STORE });
  }

  const cacheKey = keys.slice().sort().join(",");
  if (cache && cache.key === cacheKey && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ widgets: cache.body }, { headers: NO_STORE });
  }

  const supabase = (await createServiceClient()) as any;
  const results = await Promise.all(keys.map((key) => loadWidget(supabase, key)));
  const body: Record<string, WidgetData | null> = {};
  keys.forEach((key, i) => { body[key] = results[i]; });
  cache = { at: Date.now(), key: cacheKey, body };
  return NextResponse.json({ widgets: body }, { headers: NO_STORE });
}
