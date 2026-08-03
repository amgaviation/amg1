"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/portal/audit";
import { sendEmail } from "@/lib/portal/notification-delivery";
import {
  downloadBriefing,
  generateAndStoreBriefing,
  markBriefingEmailed,
} from "@/lib/portal/mission-briefings";
import { actor, str } from "./_helpers";

/**
 * Route briefing actions.
 *
 * Generation mirrors previewQuotePdf (app/portal/actions/quotes.ts): build,
 * store, then redirect to the viewer. Emailing mirrors sendQuote's ordering —
 * send FIRST and only record the send if the provider accepted it, so a failed
 * delivery never leaves a record claiming crew were briefed.
 */

export async function generateBriefing(formData: FormData) {
  const admin = await actor(["admin"], "flight_intel.view");
  const missionId = str(formData, "mission_id");
  if (!missionId) redirect("/portal/admin/trips");

  let briefingId: string;
  try {
    const stored = await generateAndStoreBriefing(missionId, admin.id);
    if (!stored) redirect("/portal/admin/trips?error=mission-missing");
    briefingId = stored.row.id;

    await logAuditEvent({
      actor: admin,
      action: "route_briefing_generated",
      detail: `Generated route briefing for ${stored.briefing.mission.ref}${stored.briefing.gaps.length ? ` (${stored.briefing.gaps.length} data gap${stored.briefing.gaps.length === 1 ? "" : "s"})` : ""}.`,
      entityType: "mission",
      entityId: missionId,
    });
  } catch (error) {
    // A redirect() inside the try throws by design — rethrow it untouched.
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[briefings] generate failed", error);
    redirect(`/portal/admin/trips/${missionId}?error=briefing-failed`);
  }

  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/api/portal/briefings/${briefingId}/content`);
}

export async function emailBriefingToCrew(formData: FormData) {
  const admin = await actor(["admin"], "flight_intel.view");
  const missionId = str(formData, "mission_id");
  if (!missionId) redirect("/portal/admin/trips");

  try {
    const stored = await generateAndStoreBriefing(missionId, admin.id);
    if (!stored) redirect("/portal/admin/trips?error=mission-missing");

    const recipients = [
      ...new Set(stored.briefing.crew.map((member) => member.email).filter((e): e is string => Boolean(e))),
    ];
    if (!recipients.length) {
      redirect(`/portal/admin/trips/${missionId}?error=no-crew-email`);
    }

    const m = stored.briefing.mission;
    const route = `${m.departureAirport ?? "?"} → ${m.arrivalAirport ?? "?"}`;
    const criticalCount = stored.briefing.tfrs.filter((t) => t.severity === "critical").length;

    const blob = await downloadBriefing(stored.row);
    const bytes = blob ? Buffer.from(await blob.arrayBuffer()) : stored.buffer;

    // Send before recording. If the provider rejects, the briefing row stays
    // un-emailed rather than claiming a delivery that never happened.
    const result = await sendEmail({
      to: recipients[0],
      cc: recipients.slice(1),
      subject: `Route briefing — ${m.ref} ${route}`,
      text: [
        `Route briefing for ${m.ref} (${route}).`,
        criticalCount ? `${criticalCount} critical airspace restriction(s) affect this route.` : "",
        "",
        "The attached PDF covers active TFRs, both airports' runway data and advisory suitability, airspace along the route, and nearby obstacles.",
        "",
        "This is a planning aid, not a dispatch release. Verify performance against AFM data and current NOTAMs before departure.",
      ]
        .filter(Boolean)
        .join("\n"),
      attachments: [
        {
          filename: stored.filename,
          content: bytes.toString("base64"),
          content_type: "application/pdf",
        },
      ],
      eventType: "route_briefing_sent",
    });

    if (result.status !== "sent") {
      redirect(`/portal/admin/trips/${missionId}?error=briefing-send-failed`);
    }

    await markBriefingEmailed(stored.row.id, recipients);
    await logAuditEvent({
      actor: admin,
      action: "route_briefing_emailed",
      detail: `Emailed route briefing for ${m.ref} to ${recipients.join(", ")}.`,
      entityType: "mission",
      entityId: missionId,
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[briefings] email failed", error);
    redirect(`/portal/admin/trips/${missionId}?error=briefing-send-failed`);
  }

  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=briefing-sent`);
}
