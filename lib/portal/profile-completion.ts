import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { PortalRole } from "@/lib/portal/constants";

/**
 * Central per-role "profile setup complete" criteria. One function, one
 * source of truth — every dashboard notice and settings save flows through
 * here, so banners can never go stale: completion is computed live on each
 * load and the persisted `profile_completed_at` marker is reconciled
 * (set the first time criteria are met, cleared if required fields are
 * later removed).
 *
 * Required fields per role mirror that role's settings/profile form:
 * - client:  name + phone on file, billing contact name + email
 * - crew:    crew_profiles.profile_completion_percent >= 100 (existing)
 * - partner: company name, partner type, primary contact, phone, contact email
 * - admin:   name + phone on file
 */

export type ProfileCompletion = {
  complete: boolean;
  missing: string[];
  settingsHref: string;
  settingsLabel: string;
};

const SETTINGS_HREF: Record<PortalRole, string> = {
  client: "/portal/client/settings",
  crew: "/portal/crew/settings",
  admin: "/portal/admin/settings",
  partner: "/portal/partner/profile",
  super_admin: "/portal/admin/settings",
};

function has(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export async function getProfileCompletion(
  userId: string,
  role: PortalRole
): Promise<ProfileCompletion> {
  const db = (await createServiceClient()) as any;
  const missing: string[] = [];

  const { data: profile } = await db
    .from("profiles")
    .select("full_name, phone, billing_contact_name, billing_contact_email, profile_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (role === "client") {
    if (!has(profile?.full_name)) missing.push("name");
    if (!has(profile?.phone)) missing.push("phone number");
    if (!has(profile?.billing_contact_name)) missing.push("billing contact name");
    if (!has(profile?.billing_contact_email)) missing.push("billing contact email");
  } else if (role === "crew") {
    const { data: crew } = await db
      .from("crew_profiles")
      .select("profile_completion_percent, profile_completed_at")
      .eq("id", userId)
      .maybeSingle();
    const percent = crew?.profile_completion_percent ?? 0;
    if (percent < 100) {
      missing.push(`crew profile ${percent}% complete — contact, hours, certificates, medical, and availability are required`);
    }
  } else if (role === "partner") {
    const { data: partner } = await db
      .from("partner_profiles")
      .select("company_name, partner_type, primary_contact, phone, contact_email")
      .eq("id", userId)
      .maybeSingle();
    if (!has(partner?.company_name)) missing.push("company name");
    if (!has(partner?.partner_type)) missing.push("partner type");
    if (!has(partner?.primary_contact)) missing.push("primary contact");
    if (!has(partner?.phone)) missing.push("phone number");
    if (!has(partner?.contact_email)) missing.push("contact email");
  } else {
    // admin / super_admin
    if (!has(profile?.full_name)) missing.push("name");
    if (!has(profile?.phone)) missing.push("phone number");
  }

  const complete = missing.length === 0;

  // Reconcile the persisted marker so it always mirrors reality. Crew keeps
  // its own marker maintained by saveCrewProfile; everyone else lives on
  // profiles.profile_completed_at.
  if (role !== "crew") {
    const marked = has(profile?.profile_completed_at);
    if (complete && !marked) {
      await db
        .from("profiles")
        .update({ profile_completed_at: new Date().toISOString() })
        .eq("id", userId);
    } else if (!complete && marked) {
      await db.from("profiles").update({ profile_completed_at: null }).eq("id", userId);
    }
  }

  return {
    complete,
    missing,
    settingsHref: SETTINGS_HREF[role],
    settingsLabel: role === "partner" ? "Open Company Profile" : "Open Settings",
  };
}
