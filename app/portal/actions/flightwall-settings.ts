"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/portal/audit";
import { actor, bool, num, str } from "./_helpers";

const KNOWN_PANELS = ["map", "requests", "missions", "revenue", "metar"] as const;
const SETTINGS_PATH = "/portal/admin/settings/flightwall";

function parseTails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,]+/)
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
    )
  ).slice(0, 50); // generous cap; this only ever highlights aircraft, never gates access
}

function parsePanelOrder(fd: FormData): string[] {
  // Rendered as one <select> per KNOWN_PANELS slot (see the settings page);
  // de-dupe while preserving the chosen order, then fill in anything left out.
  const chosen: string[] = [];
  for (let i = 0; i < KNOWN_PANELS.length; i++) {
    const value = str(fd, `panel_slot_${i}`);
    if (KNOWN_PANELS.includes(value as (typeof KNOWN_PANELS)[number]) && !chosen.includes(value)) {
      chosen.push(value);
    }
  }
  for (const panel of KNOWN_PANELS) {
    if (!chosen.includes(panel)) chosen.push(panel);
  }
  return chosen;
}

export async function saveFlightwallSettings(formData: FormData) {
  const admin = await actor(["admin"]);

  const homeLat = num(formData, "home_lat");
  const homeLon = num(formData, "home_lon");
  const rangeNm = num(formData, "range_nm");
  const flightsPollSeconds = num(formData, "flights_poll_seconds");
  const opsPollSeconds = num(formData, "ops_poll_seconds");
  const metarStation = str(formData, "metar_station").toUpperCase().slice(0, 4);

  if (
    homeLat === null || homeLat < -90 || homeLat > 90 ||
    homeLon === null || homeLon < -180 || homeLon > 180 ||
    rangeNm === null || rangeNm < 5 || rangeNm > 250 ||
    flightsPollSeconds === null || flightsPollSeconds < 5 || flightsPollSeconds > 300 ||
    opsPollSeconds === null || opsPollSeconds < 10 || opsPollSeconds > 300 ||
    metarStation.length < 3
  ) {
    redirect(`${SETTINGS_PATH}?error=invalid`);
  }

  // flightwall_settings is newer than the generated Supabase types — cast
  // the client, matching the existing repo-wide workaround (see crm.ts).
  const supabase = (await createServiceClient()) as any;
  const { error } = await supabase
    .from("flightwall_settings")
    .update({
      home_lat: homeLat,
      home_lon: homeLon,
      range_nm: rangeNm,
      watchlist_tails: parseTails(str(formData, "watchlist_tails")),
      panel_order: parsePanelOrder(formData),
      show_map: bool(formData, "show_map"),
      show_requests: bool(formData, "show_requests"),
      show_missions: bool(formData, "show_missions"),
      show_revenue: bool(formData, "show_revenue"),
      show_metar: bool(formData, "show_metar"),
      flights_poll_seconds: flightsPollSeconds,
      ops_poll_seconds: opsPollSeconds,
      metar_station: metarStation,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    .eq("id", true);

  if (error) {
    console.error("[flightwall] settings save failed", error);
    redirect(`${SETTINGS_PATH}?error=save`);
  }

  await logAuditEvent({
    actor: admin,
    action: "flightwall_settings_updated",
    detail: `range=${rangeNm}nm metar=${metarStation}`,
    entityType: "flightwall_settings",
    entityId: "global",
  });

  revalidatePath(SETTINGS_PATH);
  revalidatePath("/ops/flightwall");
  redirect(`${SETTINGS_PATH}?success=1`);
}
