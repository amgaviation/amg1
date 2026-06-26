import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { absolutePortalUrl, defaultSender, replyToAddress } from "@/lib/email/config";
import { portalNotificationEmail } from "@/lib/portal/email-templates";
import type { Database } from "@/lib/supabase/database.types";

type DeliveryInsert = Database["public"]["Tables"]["notification_deliveries"]["Insert"];
type DeliveryChannel = "email" | "sms";
type DeliveryStatus = "sent" | "suppressed" | "failed";

type QueueDeliveryInput = {
  userId: string;
  notificationId?: string | null;
  title: string;
  body?: string | null;
  html?: string | null;
  eventType?: string | null;
  channels?: DeliveryChannel[];
  replyTo?: string | null;
};

type DeliveryResult = {
  status: DeliveryStatus;
  providerMessageId?: string;
  error?: string;
};

function configured(channel: DeliveryChannel) {
  if (channel === "email") {
    return Boolean(process.env.RESEND_API_KEY);
  }

  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER,
  );
}

function defaultChannels(eventType?: string | null): DeliveryChannel[] {
  const urgent = eventType
    ? /urgent|aog|assignment|quote|invoice|expense|credential/i.test(eventType)
    : false;

  return urgent ? ["email", "sms"] : ["email"];
}

function emailText(title: string, body?: string | null) {
  return body ? `${title}\n\n${body}` : title;
}

function defaultEmailHtml(input: QueueDeliveryInput) {
  return portalNotificationEmail({
    title: input.title,
    body: input.body,
    eventType: input.eventType,
    portalUrl: absolutePortalUrl("/portal"),
  });
}

/**
 * Create delivery records and deliver them immediately.
 *
 * The previous implementation only inserted rows with status "queued" and
 * never had a worker that processed those rows. This implementation keeps the
 * audit trail while making email/SMS delivery occur during the server action.
 */
export async function queueNotificationDeliveries(
  input: QueueDeliveryInput,
): Promise<void> {
  try {
    const db = await createServiceClient();
    const { data: profile } = await db
      .from("profiles")
      .select("email, phone")
      .eq("id", input.userId)
      .maybeSingle();

    if (!profile) return;

    const channels = input.channels ?? defaultChannels(input.eventType);

    for (const channel of channels) {
      const recipient = channel === "email" ? profile.email : profile.phone;
      if (!recipient) continue;

      const isConfigured = configured(channel);
      const initialStatus = isConfigured ? "processing" : "suppressed";
      const initialError = isConfigured
        ? null
        : `${channel} provider is not configured`;

      const row: DeliveryInsert = {
        notification_id: input.notificationId ?? null,
        user_id: input.userId,
        channel,
        recipient,
        event_type: input.eventType ?? null,
        provider: channel === "email" ? "resend" : "twilio",
        status: initialStatus,
        error_message: initialError,
        attempted_at: isConfigured ? new Date().toISOString() : null,
      };

      const { data: delivery, error: insertError } = await db
        .from("notification_deliveries")
        .insert(row)
        .select("id")
        .single();

      if (insertError || !delivery) {
        console.error(
          "[notify] failed to create delivery record",
          input.eventType,
          insertError,
        );
        continue;
      }

      if (!isConfigured) continue;

      let result: DeliveryResult;
      try {
        result =
          channel === "email"
            ? await sendEmail({
                to: recipient,
                subject: input.title,
                text: emailText(input.title, input.body),
                html: input.html ?? defaultEmailHtml(input),
                replyTo: input.replyTo ?? undefined,
              })
            : await sendSms({
                to: recipient,
                body: input.body
                  ? `${input.title}: ${input.body}`
                  : input.title,
              });
      } catch (error) {
        result = {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown delivery error",
        };
      }

      await db
        .from("notification_deliveries")
        .update({
          status: result.status,
          provider_message_id: result.providerMessageId ?? null,
          error_message: result.error ?? null,
          attempted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);
    }
  } catch (error) {
    console.error(
      "[notify] failed to deliver external notification",
      input.eventType,
      error,
    );
  }
}

export async function sendEmail(params: {
  to: string;
  cc?: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: {
    filename: string;
    content: string;
    content_type?: string;
  }[];
}): Promise<DeliveryResult> {
  const from = defaultSender("operations");
  const replyTo = replyToAddress(params.replyTo);

  if (!process.env.RESEND_API_KEY || !from) {
    return { status: "suppressed", error: "Resend is not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      reply_to: replyTo,
      to: params.to,
      cc: params.cc?.length ? params.cc : undefined,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      status: "failed",
      error: payload?.message ?? "Resend request failed",
    };
  }

  return { status: "sent", providerMessageId: payload?.id };
}

export async function sendSms(params: {
  to: string;
  body: string;
}): Promise<DeliveryResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return { status: "suppressed", error: "Twilio is not configured" };
  }

  const body = new URLSearchParams({
    To: params.to,
    From: from,
    Body: params.body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      status: "failed",
      error: payload?.message ?? "Twilio request failed",
    };
  }

  return { status: "sent", providerMessageId: payload?.sid };
}
