"use server";

import { redirect } from "next/navigation";
import { suppressEmail, verifyUnsubscribeToken } from "@/lib/portal/lead-suppression";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Record an unsubscribe. Unauthenticated by necessity — the recipient is a
 * stranger — so the signed token in the URL is the entire authorization, and it
 * only ever authorizes removing the one address it encodes.
 *
 * No rate limiting: the only action available is "stop emailing this address",
 * which is idempotent and which we would honour from anyone who asked anyway.
 */
export async function confirmUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const email = verifyUnsubscribeToken(token);
  if (!email) redirect("/unsubscribe/invalid");

  await suppressEmail(email, "unsubscribed", "One-click unsubscribe from outreach email");

  // Leave a trail on any matching lead so an admin reading the record sees the
  // opt-out in the same history as the sends that prompted it.
  try {
    const db = (await createServiceClient()) as any;
    const { data: leads } = await db.from("crm_leads").select("id").ilike("email", email);
    for (const lead of leads ?? []) {
      await db.from("crm_activities").insert({
        lead_id: lead.id,
        activity_type: "unsubscribed",
        body: `${email} unsubscribed via the link in an outreach email. All further outreach is blocked.`,
      });
    }
  } catch (error) {
    // The suppression itself is recorded; failing to annotate the CRM must not
    // make the unsubscribe look like it failed.
    console.error("[outreach] failed to log unsubscribe activity", error);
  }

  redirect(`/unsubscribe/${token}?done=1`);
}
