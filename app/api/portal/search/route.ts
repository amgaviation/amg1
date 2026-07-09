import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";
import { permissionsForRole } from "@/lib/portal/permissions";
import { privateJson } from "@/lib/portal/api-guard";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type SearchResult = {
  group: string;
  label: string;
  sublabel?: string;
  href: string;
};

/** Admin global search across operational records (Cmd+K palette). */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isAdminRole(user.role) || user.status !== "approved") {
    return NextResponse.json({ results: [] }, { status: 403 });
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return privateJson({ results: [] });

  // Respect the role-permission matrix: don't surface record labels from —
  // or dead-end links into — modules this admin cannot view.
  const perms = await permissionsForRole(user.role);
  const canPeople = perms.clients.view || perms.crew.view || perms.partners.view || perms.users.view;

  const db = (await createServiceClient()) as any;
  const like = `%${q}%`;
  const results: SearchResult[] = [];
  const none = Promise.resolve({ data: [] });

  const [missions, profiles, invoices, quotes, leads, aircraft] = await Promise.all([
    perms.missions.view
      ? db
          .from("missions")
          .select("id, ref, departure_airport, arrival_airport, tail_number, status")
          .or(`ref.ilike.${like},departure_airport.ilike.${like},arrival_airport.ilike.${like},tail_number.ilike.${like}`)
          .limit(5)
      : none,
    canPeople
      ? db
          .from("profiles")
          .select("id, full_name, email, company_name, role")
          .eq("is_deleted", false)
          .or(`full_name.ilike.${like},email.ilike.${like},company_name.ilike.${like}`)
          .limit(5)
      : none,
    perms.invoices.view
      ? db
          .from("invoices")
          .select("id, invoice_number, status, total")
          .ilike("invoice_number", like)
          .limit(5)
      : none,
    perms.quotes.view
      ? db.from("quotes").select("id, ref, status, total").ilike("ref", like).limit(5)
      : none,
    perms.crm.view
      ? db
          .from("crm_leads")
          .select("id, full_name, company, stage")
          .or(`full_name.ilike.${like},company.ilike.${like},email.ilike.${like}`)
          .limit(5)
      : none,
    perms.aircraft.view
      ? db
          .from("aircraft")
          .select("id, tail_number, make, model")
          .or(`tail_number.ilike.${like},make.ilike.${like},model.ilike.${like}`)
          .limit(5)
      : none,
  ]);

  for (const row of missions.data ?? []) {
    results.push({
      group: "Support Requests",
      label: `${row.ref} · ${row.departure_airport} → ${row.arrival_airport}`,
      sublabel: `${row.tail_number ?? "TBD"} · ${row.status}`,
      href: `/portal/admin/trips/${row.id}`,
    });
  }
  for (const row of profiles.data ?? []) {
    // Route each person to their directory — and skip them when this admin
    // cannot view that directory.
    const personModuleView =
      row.role === "client"
        ? perms.clients.view
        : row.role === "crew"
          ? perms.crew.view
          : row.role === "partner"
            ? perms.partners.view
            : perms.users.view;
    if (!personModuleView) continue;
    const href =
      row.role === "client"
        ? `/portal/admin/clients/${row.id}`
        : row.role === "crew"
          ? `/portal/admin/crew/${row.id}`
          : row.role === "partner"
            ? `/portal/admin/partners/${row.id}`
            : "/portal/admin/users";
    results.push({
      group: "People",
      label: row.full_name ?? row.email,
      sublabel: [row.role, row.company_name].filter(Boolean).join(" · "),
      href,
    });
  }
  for (const row of invoices.data ?? []) {
    results.push({
      group: "Invoices",
      label: row.invoice_number,
      sublabel: row.status,
      href: `/portal/admin/invoices/${row.id}`,
    });
  }
  for (const row of quotes.data ?? []) {
    results.push({
      group: "Quotes",
      label: row.ref,
      sublabel: row.status,
      href: `/portal/admin/quotes/${row.id}`,
    });
  }
  for (const row of leads.data ?? []) {
    results.push({
      group: "Leads",
      label: row.full_name,
      sublabel: [row.company, row.stage].filter(Boolean).join(" · "),
      href: `/portal/admin/crm/${row.id}`,
    });
  }
  for (const row of aircraft.data ?? []) {
    results.push({
      group: "Aircraft",
      label: row.tail_number,
      sublabel: [row.make, row.model].filter(Boolean).join(" "),
      href: `/portal/admin/aircraft/${row.id}`,
    });
  }

  return privateJson({ results: results.slice(0, 24) });
}
