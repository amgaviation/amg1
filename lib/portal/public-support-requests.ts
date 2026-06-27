import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type PublicSupportRequestDetail = {
  id: string;
  mission_id: string;
  client_id: string | null;
  requester_name: string;
  email: string;
  phone: string | null;
  preferred_contact_method: string | null;
  company_name: string | null;
  requested_service_category: string;
  aircraft_make: string | null;
  aircraft_model: string | null;
  aircraft_display: string | null;
  tail_number: string | null;
  aircraft_base: string | null;
  requested_timing: string | null;
  route: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  operational_summary: string | null;
  category_details: Record<string, string> | null;
  raw_form: Record<string, string | boolean | string[]> | null;
  source_form_type: string | null;
  source_submission_id: string | null;
  portal_account_status: string | null;
  portal_account_user_id: string | null;
  portal_invitation_sent_at: string | null;
  created_at: string;
};

export async function getPublicSupportRequestForMission(
  missionId: string,
): Promise<PublicSupportRequestDetail | null> {
  try {
    const db = await createServiceClient();
    const { data, error } = await (db as any)
      .from("public_support_requests")
      .select("*")
      .eq("mission_id", missionId)
      .maybeSingle();

    if (error) {
      console.error("[public-support-request] lookup failed", { missionId, error });
      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error("[public-support-request] lookup crashed", { missionId, error });
    return null;
  }
}

export function publicSupportLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
