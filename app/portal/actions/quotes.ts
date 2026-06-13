"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyAdmins, notifyUser } from "@/lib/portal/audit";
import { notifyMissionContactByEmail } from "@/lib/portal/mission-client-notifications";
import { actor, str } from "./_helpers";

export async function createQuote(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  if (!missionId) redirect("/portal/admin/quotes?error=missing");

  const { data: mission } = await db
    .from("missions")
    .select("ref, client_id")
    .eq("id", missionId)
    .maybeSingle();

  const categories = formData.getAll("category[]").map((v) => String(v).trim());
  const descriptions = formData.getAll("description[]").map((v) => String(v).trim());
  const quantities = formData.getAll("quantity[]").map((v) => Number(v) || 0);
  const unitPrices = formData.getAll("unit_price[]").map((v) => Number(v) || 0);

  const items = categories
    .map((category, i) => ({
      category,
      description: descriptions[i] || null,
      quantity: quantities[i] || 1,
      unit_price: unitPrices[i] || 0,
      amount: (quantities[i] || 1) * (unitPrices[i] || 0),
      sort_order: i,
    }))
    .filter((it) => it.category && it.amount >= 0);

  const total = items.reduce((sum, it) => sum + it.amount, 0);

  const { data: quote } = await db
    .from("quotes")
    .insert({
      mission_id: missionId,
      client_id: mission?.client_id ?? null,
      status: "sent",
      subtotal: total,
      total,
      client_notes: str(formData, "client_notes") || null,
      internal_notes: str(formData, "internal_notes") || null,
      created_by: admin.id,
    })
    .select("id, ref")
    .single();

  if (quote && items.length) {
    await db
      .from("quote_line_items")
      .insert(items.map((it) => ({ ...it, quote_id: quote.id })));
  }
  await db.from("missions").update({ status: "quoted" }).eq("id", missionId);

  await logAuditEvent({
    actor: admin,
    action: "quote_created",
    detail: `Created ${quote?.ref ?? "quote"} ($${total}) for ${mission?.ref ?? missionId}`,
    entityType: "quote",
    entityId: quote?.id ?? null,
  });
  if (mission?.client_id) {
    await notifyUser({
      userId: mission.client_id,
      title: "Quote ready",
      body: `${quote?.ref ?? "A quote"} is ready for your review.`,
      type: "quote_sent",
      entityType: "quote",
      entityId: quote?.id ?? null,
    });
  }
  if (quote) {
    await notifyMissionContactByEmail({
      missionId,
      title: "Quote ready for review",
      eventLabel: "Quote Sent",
      subject: `AMG Aviation Group quote ${quote.ref} is ready`,
      intro:
        "AMG Aviation Group has prepared a quote for your request. Please review the quote details and contact AMG Operations with any questions or required changes.",
      details: [
        { label: "Quote Reference", value: quote.ref },
        { label: "Quote Total", value: `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      ],
    });
  }
  revalidatePath(`/portal/admin/trips/${missionId}`);
  revalidatePath("/portal/admin/quotes");
  redirect(`/portal/admin/trips/${missionId}?success=quote`);
}

export async function respondToQuote(formData: FormData) {
  const user = await actor(["client", "admin"]);
  const db = await createServiceClient();
  const quoteId = str(formData, "quote_id");
  const decision = str(formData, "decision"); // approved | rejected

  const { data: quote } = await db
    .from("quotes")
    .select("ref, mission_id, client_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) redirect("/portal/client/quotes?error=notfound");
  if (user.role !== "admin" && quote.client_id !== user.id) {
    redirect("/portal/client/quotes?error=forbidden");
  }

  await db
    .from("quotes")
    .update({
      status: decision === "approved" ? "approved" : "rejected",
      approved_by: decision === "approved" ? user.id : null,
    })
    .eq("id", quoteId);

  if (decision === "approved" && quote.mission_id) {
    await db.from("missions").update({ status: "approved" }).eq("id", quote.mission_id);
  }

  await logAuditEvent({
    actor: user,
    action: decision === "approved" ? "quote_approved" : "quote_rejected",
    detail: `${decision} ${quote.ref}`,
    entityType: "quote",
    entityId: quoteId,
  });
  await notifyAdmins({
    title: `Quote ${decision}`,
    body: `${user.name} ${decision} ${quote.ref}.`,
    type: "quote_response",
    entityType: "quote",
    entityId: quoteId,
  });

  revalidatePath("/portal/client/quotes");
  redirect(`/portal/client/quotes/${quoteId}?success=${decision}`);
}
