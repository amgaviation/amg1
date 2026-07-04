"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, isoOrNull, str } from "./_helpers";
import { safeRedirectPath } from "./_helpers";

const TASKS_PATH = "/portal/admin/tasks";

export async function createTask(formData: FormData) {
  const admin = await actor(["admin"]);
  const title = str(formData, "title");
  const backTo = safeRedirectPath(str(formData, "back_to"), TASKS_PATH);
  if (!title) redirect(`${backTo}?error=missing`);

  const assignedTo = str(formData, "assigned_to") || admin.id;
  const db = (await createServiceClient()) as any;
  const { data: task, error } = await db
    .from("ops_tasks")
    .insert({
      title,
      detail: str(formData, "detail") || null,
      priority: str(formData, "priority") || "normal",
      due_at: isoOrNull(formData, "due_at"),
      assigned_to: assignedTo,
      related_type: str(formData, "related_type") || null,
      related_id: str(formData, "related_id") || null,
      related_label: str(formData, "related_label") || null,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !task) redirect(`${backTo}?error=save`);

  if (assignedTo !== admin.id) {
    await notifyUser({
      userId: assignedTo,
      title: `Task assigned: ${title}`,
      body: str(formData, "detail") || "Open Tasks in Operations Command for details.",
      type: "ops_task",
      entityType: "ops_task",
      entityId: task.id,
    });
  }
  await logAuditEvent({
    actor: admin,
    action: "ops_task_created",
    detail: title,
    entityType: "ops_task",
    entityId: task.id,
  });
  revalidatePath(TASKS_PATH);
  revalidatePath("/portal/admin/dashboard");
  redirect(`${backTo}?success=created`);
}

export async function setTaskStatus(formData: FormData) {
  const admin = await actor(["admin"]);
  const taskId = str(formData, "task_id");
  const status = str(formData, "status");
  const backTo = safeRedirectPath(str(formData, "back_to"), TASKS_PATH);
  if (!taskId || !["open", "in_progress", "done", "cancelled"].includes(status)) {
    redirect(`${backTo}?error=missing`);
  }

  const db = (await createServiceClient()) as any;
  const { error } = await db
    .from("ops_tasks")
    .update({
      status,
      updated_at: new Date().toISOString(),
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);
  if (error) redirect(`${backTo}?error=save`);

  await logAuditEvent({
    actor: admin,
    action: `ops_task_${status}`,
    entityType: "ops_task",
    entityId: taskId,
  });
  revalidatePath(TASKS_PATH);
  revalidatePath("/portal/admin/dashboard");
  redirect(`${backTo}?success=updated`);
}
