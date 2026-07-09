"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Mark a single notification read — scoped to the signed-in user so one member
 * can never flip another's notification. Called when a notification row is
 * clicked through to its entity. Best-effort: a failed write must not break the
 * navigation the click also triggers.
 */
export async function markNotificationRead(id: string): Promise<void> {
  if (!id) return;
  const user = await getSessionUser();
  if (!user) return;
  try {
    const db = await createServiceClient();
    await db
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_read", false);
  } catch (error) {
    console.error("[notify] failed to mark notification read", id, error);
    return;
  }
  // Refresh the topbar unread badge (computed in the portal layout) and the
  // notifications feed itself.
  revalidatePath("/portal", "layout");
}

/**
 * Mark every unread notification for the signed-in user read. Bound to the
 * intentional "Mark all read" control on each role's notifications page.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  try {
    const db = await createServiceClient();
    await db
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  } catch (error) {
    console.error("[notify] failed to mark all notifications read", user.id, error);
    return;
  }
  revalidatePath("/portal", "layout");
}
