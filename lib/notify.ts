import "server-only";
import { logAuditEvent } from "@/lib/audit";

// TODO: Replace with Resend email integration for production notifications.
// For now, notification events are logged to audit_events for visibility.

type NotifyInput = {
  recipientId?: string;
  recipientEmail?: string;
  subject: string;
  body: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
};

export async function notify({
  recipientId: _recipientId,
  recipientEmail,
  subject,
  body,
  actorId,
  actorEmail,
  actorRole,
}: NotifyInput) {
  // Log the notification intent as an audit event
  await logAuditEvent({
    actorId,
    actorEmail,
    actorRole,
    action: "Notification queued",
    detail: `To: ${recipientEmail ?? "unknown"} | Subject: ${subject} | ${body}`,
    entityType: "notification",
  });

  // TODO: Implement email delivery via Resend:
  // import { Resend } from "resend";
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: "noreply@amg.aero", to: recipientEmail, subject, html: body });
}
