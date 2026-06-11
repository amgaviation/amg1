import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type DeliveryInsert = Database["public"]["Tables"]["notification_deliveries"]["Insert"];

type QueueDeliveryInput = {
  userId: string;
  notificationId?: string | null;
  title: string;
  body?: string | null;
  eventType?: string | null;
  channels?: ("email" | "sms")[];
};

function configured(channel: "email" | "sms") {
  if (channel === "email") return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM_ADDRESS);
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

function defaultChannels(eventType?: string | null): ("email" | "sms")[] {
  const urgent = eventType ? /urgent|aog|assignment|quote|invoice|expense|credential/i.test(eventType) : false;
  return urgent ? ["email", "sms"] : ["email"];
}

export async function queueNotificationDeliveries(input: QueueDeliveryInput): Promise<void> {
  try {
    const db = await createServiceClient();
    const { data: profile } = await db
      .from("profiles")
      .select("email, phone")
      .eq("id", input.userId)
      .maybeSingle();
    if (!profile) return;

    const channels = input.channels ?? defaultChannels(input.eventType);
    const rows: DeliveryInsert[] = [];
    for (const channel of channels) {
      const recipient = channel === "email" ? profile.email : profile.phone;
      if (!recipient) continue;
      const isConfigured = configured(channel);
      rows.push({
        notification_id: input.notificationId ?? null,
        user_id: input.userId,
        channel,
        recipient,
        event_type: input.eventType ?? null,
        provider: channel === "email" ? "resend" : "twilio",
        status: isConfigured ? "queued" : "suppressed",
        error_message: isConfigured ? null : `${channel} provider is not configured`,
      });
    }
    if (rows.length) await db.from("notification_deliveries").insert(rows);
  } catch (error) {
    console.error("[notify] failed to queue external delivery", input.eventType, error);
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ status: "sent" | "suppressed" | "failed"; providerMessageId?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM_ADDRESS) {
    return { status: "suppressed", error: "Resend is not configured" };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM_ADDRESS,
      reply_to: process.env.EMAIL_REPLY_TO || undefined,
      to: params.to,
      subject: params.subject,
      text: params.text,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { status: "failed", error: payload?.message ?? "Resend request failed" };
  return { status: "sent", providerMessageId: payload?.id };
}

export async function sendSms(params: {
  to: string;
  body: string;
}): Promise<{ status: "sent" | "suppressed" | "failed"; providerMessageId?: string; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return { status: "suppressed", error: "Twilio is not configured" };

  const body = new URLSearchParams({ To: params.to, From: from, Body: params.body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { status: "failed", error: payload?.message ?? "Twilio request failed" };
  return { status: "sent", providerMessageId: payload?.sid };
}
