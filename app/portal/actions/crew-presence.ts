"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { actor } from "./_helpers";
import type { AirportOption } from "@/lib/portal/crew-map";

/**
 * Crew presence actions. The go-active/offline RPCs are SECURITY DEFINER and
 * read auth.uid(), so they are invoked with the SESSION client (the crew
 * member's JWT). All eligibility, clamping, and availability sync happen in the
 * database; these just relay the call and surface the result to the UI.
 */

type Result = { ok: boolean; error?: string; expiresAt?: string };

function friendly(message: string): string {
  // Only surface messages we deliberately raise; everything else is an internal
  // DB error (e.g. a unique-violation from a go-active race) and must never be
  // shown verbatim — it would leak table/constraint names.
  const raw = (message ?? "").trim();
  if (/^unknown airport/i.test(raw)) return "That airport isn't recognized — pick one from the list.";
  if (/^not authenticated/i.test(raw)) return "Your session expired — refresh and try again.";
  const eligible = raw.match(/^not eligible:\s*(.+)$/i);
  if (eligible) return eligible[1].trim();
  return "Could not update your availability. Try again.";
}

export async function goActive(airport: string, minutes: number): Promise<Result> {
  await actor(["crew"]);
  const db = (await createClient()) as any;
  const { data, error } = await db.rpc("rpc_crew_go_active", {
    p_airport: String(airport ?? "").toUpperCase().trim(),
    p_duration_minutes: Math.max(1, Math.min(360, Math.round(Number(minutes) || 60))),
  });
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/portal/crew/live-map");
  revalidatePath("/portal/crew/dashboard");
  const row = Array.isArray(data) ? data[0] : data;
  return { ok: true, expiresAt: row?.expires_at };
}

export async function goOffline(): Promise<Result> {
  await actor(["crew"]);
  const db = (await createClient()) as any;
  const { error } = await db.rpc("rpc_crew_go_offline");
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/portal/crew/live-map");
  revalidatePath("/portal/crew/dashboard");
  return { ok: true };
}

/** Searchable airport picker source (code / name / city). Scales past the seed. */
export async function searchAirports(q: string): Promise<AirportOption[]> {
  await actor(["crew"]);
  // Strip PostgREST-significant characters (comma, parens, dot, colon, star,
  // quotes, backslash, percent) so the term can't break out of the .or() filter.
  const term = String(q ?? "")
    .replace(/[^a-zA-Z0-9 \-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const db = await createServiceClient();
  let query = db
    .from("airports")
    .select("code, name, city, state")
    .eq("is_active", true)
    .order("code")
    .limit(20);
  if (term) {
    const like = `%${term}%`;
    query = query.or(`code.ilike.${like},name.ilike.${like},city.ilike.${like},iata.ilike.${like}`);
  }
  const { data } = await query;
  return (data ?? []) as AirportOption[];
}
