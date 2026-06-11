"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

export async function postMessage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const thread_id = String(formData.get("thread_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!thread_id || !body) redirect("/portal/messages?error=missing-fields");

  const { error } = await supabase.from("messages").insert({
    thread_id,
    sender_id: user.id,
    sender_email: user.email,
    body,
  });

  if (!error) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "Posted message",
      entityType: "message",
      entityId: thread_id,
    });
  }

  revalidatePath("/portal/messages");
  redirect("/portal/messages");
}
