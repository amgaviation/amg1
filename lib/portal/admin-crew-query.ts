import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../supabase/database.types";

export const ADMIN_CREW_QUERY_SOURCE = "public.profiles(role=crew) joined to public.crew_profiles on profiles.id = crew_profiles.id";

export type AdminCrewProfile = Tables<"profiles"> & {
  crew_profile: Tables<"crew_profiles"> | null;
};

export async function listAdminCrewProfiles(
  db: SupabaseClient<Database>
): Promise<AdminCrewProfile[]> {
  const { data: profiles, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("role", "crew")
    .order("full_name");

  if (profileError) {
    throw new Error(`Admin crew query failed reading profiles: ${profileError.message}`);
  }

  const ids = (profiles ?? []).map((profile) => profile.id);
  const { data: crewProfiles, error: crewProfileError } = ids.length
    ? await db.from("crew_profiles").select("*").in("id", ids)
    : { data: [] as Tables<"crew_profiles">[], error: null };

  if (crewProfileError) {
    throw new Error(`Admin crew query failed reading crew_profiles: ${crewProfileError.message}`);
  }

  const byId = new Map((crewProfiles ?? []).map((crewProfile) => [crewProfile.id, crewProfile]));
  return (profiles ?? []).map((profile) => ({
    ...profile,
    crew_profile: byId.get(profile.id) ?? null,
  }));
}
