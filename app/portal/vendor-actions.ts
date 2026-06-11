"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

export async function updateVendorTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const task_id = String(formData.get("task_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const quoteRaw = String(formData.get("quote_amount") ?? "").trim();

  if (!task_id) redirect("/portal/vendor-tasks");

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status) update.status = status;
  if (notesRaw) update.notes = notesRaw;
  if (quoteRaw !== "") {
    const parsed = parseFloat(quoteRaw);
    if (!isNaN(parsed)) update.quote_amount = parsed;
  }

  const { error } = await supabase
    .from("vendor_tasks")
    .update(update)
    .eq("id", task_id)
    .eq("partner_id", user.id);

  if (!error) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: "partner",
      action: "Updated vendor task",
      detail: `${task_id} → ${status}`,
      entityType: "vendor_task",
      entityId: task_id,
    });
  }

  revalidatePath("/portal/vendor-tasks");
  redirect("/portal/vendor-tasks");
}
