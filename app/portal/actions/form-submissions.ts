"use server";

import { redirect } from "next/navigation";
import { actor, str } from "@/app/portal/actions/_helpers";
import { createServiceClient } from "@/lib/supabase/server";
import { submissionStatuses } from "@/lib/public-form-options";

export async function updateFormSubmission(formData: FormData) {
  await actor(["admin"]);
  const id = str(formData, "id");
  const status = str(formData, "status");
  const adminNotes = str(formData, "admin_notes");

  if (!id || !submissionStatuses.includes(status as any)) {
    redirect("/portal/admin/form-submissions?error=invalid");
  }

  const db = await createServiceClient();
  const { error } = await (db as any)
    .from("contact_form_submissions")
    .update({
      status,
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update form submission", { id, error });
    redirect("/portal/admin/form-submissions?error=update");
  }

  redirect("/portal/admin/form-submissions?success=updated");
}
