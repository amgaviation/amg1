"use server";

import { requireUser } from "@/lib/portal/session";
import { searchAirports as searchAirportsQuery, type AirportSuggestion } from "@/lib/portal/airports";

/**
 * Airport picker search, available to any approved portal user.
 *
 * A server action rather than a route handler: the picker is only ever driven
 * from React, and the action inherits session auth instead of re-implementing
 * an API guard. The previous version of this lived in crew-presence.ts behind
 * an `actor(["crew"])` gate, which excluded the admins and clients who create
 * most trips.
 */
export async function searchAirportOptions(query: string): Promise<AirportSuggestion[]> {
  // Any approved user; the airport table is reference data, not tenant data.
  await requireUser();
  try {
    return await searchAirportsQuery(query, 20);
  } catch {
    // A picker that returns nothing is recoverable; one that throws breaks the
    // form it is embedded in.
    return [];
  }
}
