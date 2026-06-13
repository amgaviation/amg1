import "server-only";

import { amgEmailLayout } from "@/lib/portal/email-templates";
import { sendEmail } from "@/lib/portal/notification-delivery";
import { createServiceClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

type Mission = Pick<
  Tables<"missions">,
  | "id"
  | "ref"
  | "client_id"
  | "client_notes"
  | "departure_airport"
  | "arrival_airport"
  | "tail_number"
  | "mission_type"
  | "status"
>;

type MissionContact = {
  email: string;
  name?: string | null;
};

type MissionClientNotificationInput = {
  missionId: string;
  title: string;
  eventLabel: string;
  intro: string;
  subject?: string;
  details?: Array<{ label: string; value?: string | number | null }>;
  footerNote?: string;
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function extractPublicRequestEmail(notes?: string | null) {
  if (!notes) return null;

  const labeled = notes.match(/Email:\s*([^\s<>]+@[^\s<>]+)/i)?.[1];
  return labeled || notes.match(EMAIL_RE)?.[0] || null;
}

function extractPublicRequesterName(notes?: string | null) {
  if (!notes) return null;
  return notes.match(/Requester:\s*(.+)/i)?.[1]?.split("\n")[0]?.trim() || null;
}

function statusLabel(value?: string | null) {
  return value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not specified";
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || null;
}

async function getMissionContact(mission: Mission): Promise<MissionContact | null> {
  const db = await createServiceClient();

  if (mission.client_id) {
    const { data: profile } = await db
      .from("profiles")
      .select("email, full_name, company_name")
      .eq("id", mission.client_id)
      .maybeSingle();

    if (profile?.email) {
      return {
        email: profile.email,
        name: profile.full_name || profile.company_name || null,
      };
    }
  }

  const publicEmail = extractPublicRequestEmail(mission.client_notes);
  if (!publicEmail) return null;

  return {
    email: publicEmail,
    name: extractPublicRequesterName(mission.client_notes),
  };
}

export async function notifyMissionContactByEmail(input: MissionClientNotificationInput) {
  const db = await createServiceClient();
  const { data: mission, error } = await db
    .from("missions")
    .select("id, ref, client_id, client_notes, departure_airport, arrival_airport, tail_number, mission_type, status")
    .eq("id", input.missionId)
    .maybeSingle();

  if (error || !mission) {
    console.error("[mission-client-email] mission lookup failed", {
      missionId: input.missionId,
      error,
    });
    return;
  }

  const contact = await getMissionContact(mission);
  if (!contact?.email) return;

  const route = [mission.departure_airport, mission.arrival_airport]
    .filter(Boolean)
    .join(" → ");

  const baseDetails = [
    { label: "Reference", value: mission.ref },
    { label: "Route", value: route || null },
    { label: "Tail Number", value: mission.tail_number },
    { label: "Mission Type", value: statusLabel(mission.mission_type) },
    { label: "Current Status", value: statusLabel(mission.status) },
    { label: "Update", value: input.eventLabel },
  ];

  const details = [...baseDetails, ...(input.details ?? [])];
  const text = [
    `Hello ${contact.name || "there"},`,
    input.intro,
    `Reference: ${mission.ref}`,
    route ? `Route: ${route}` : null,
    `Current status: ${statusLabel(mission.status)}`,
    input.details?.length
      ? input.details
          .filter((item) => item.value !== undefined && item.value !== null && item.value !== "")
          .map((item) => `${item.label}: ${item.value}`)
          .join("\n")
      : null,
    "This message is an operational update only. AMG will confirm any required action, commitment, crew assignment, aircraft movement, or support scope separately.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const resolvedAppUrl = appUrl();

  const result = await sendEmail({
    to: contact.email,
    subject: input.subject || `AMG Aviation Group update for ${mission.ref}`,
    text,
    html: amgEmailLayout({
      previewText: `${input.eventLabel} for ${mission.ref}`,
      eyebrow: "Mission Update",
      title: input.title,
      intro: input.intro,
      reference: mission.ref,
      status: input.eventLabel,
      sections: [
        {
          title: "Mission Details",
          rows: details,
        },
        {
          title: "Next Steps",
          body:
            "AMG Operations will continue coordinating the request and will contact you if additional information or approval is required. This update does not by itself constitute mission acceptance, operational release, aircraft movement authorization, or a binding service commitment.",
        },
      ],
      cta: resolvedAppUrl
        ? {
            label: "Visit AMG Aviation Group",
            href: resolvedAppUrl,
          }
        : undefined,
      footerNote:
        input.footerNote ||
        "For urgent updates or corrections, reply to this email or contact AMG Aviation Group at information@amgaviationgroup.com.",
    }),
    replyTo: process.env.EMAIL_REPLY_TO,
  });

  if (result.status !== "sent") {
    console.error("[mission-client-email] delivery failed", {
      missionId: input.missionId,
      ref: mission.ref,
      recipient: contact.email,
      status: result.status,
      error: result.error,
    });
  }
}
