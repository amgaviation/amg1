"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const doc_name = String(formData.get("doc_name") ?? "").trim();
  const doc_type = String(formData.get("doc_type") ?? "other").trim();
  const visibility = String(formData.get("visibility") ?? "admin").trim();
  const file = formData.get("file") as File | null;

  if (!doc_name || !file || file.size === 0) {
    redirect("/portal/documents?error=missing-fields");
  }

  // Upload to storage
  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${user.id}/${Date.now()}-${doc_name.replace(/\s+/g, "-").toLowerCase()}.${ext}`;

  const fileBuffer = await file.arrayBuffer();
  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (storageError) {
    redirect("/portal/documents?error=upload-failed");
  }

  // Insert document record using service client (bypasses RLS insert check for non-admin roles)
  const serviceClient = await createServiceClient();
  const { error: dbError } = await serviceClient.from("documents").insert({
    name: doc_name,
    storage_path: storagePath,
    doc_type,
    scope_type: "system",
    visibility,
    uploaded_by: user.id,
  });

  if (!dbError) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "Uploaded document",
      detail: doc_name,
      entityType: "document",
    });
  }

  revalidatePath("/portal/documents");
  redirect("/portal/documents");
}
