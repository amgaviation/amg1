import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/** Saved passenger profiles owned by a client account. */

export type PassengerProfile = {
  id: string;
  owner_id: string;
  full_name: string;
  preferences: string | null;
  is_frequent: boolean;
  created_at: string;
};

export async function listPassengersForOwner(ownerId: string): Promise<PassengerProfile[]> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("passenger_profiles")
    .select("*")
    .eq("owner_id", ownerId)
    .order("is_frequent", { ascending: false })
    .order("full_name", { ascending: true });
  return (data ?? []) as PassengerProfile[];
}
