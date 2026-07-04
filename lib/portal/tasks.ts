import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/** Internal operations task management (admin team to-dos). */

export type OpsTask = {
  id: string;
  title: string;
  detail: string | null;
  status: "open" | "in_progress" | "done" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  due_at: string | null;
  assigned_to: string | null;
  related_type: string | null;
  related_id: string | null;
  related_label: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assignee?: { id: string; full_name: string | null; email: string } | null;
};

export const TASK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const TASK_SELECT = "*, assignee:assigned_to(id, full_name, email)";
const ACTIVE_STATUSES = ["open", "in_progress"];

export async function listTasks(filter?: {
  view?: "active" | "mine" | "done" | "all";
  userId?: string;
}): Promise<OpsTask[]> {
  const db = (await createServiceClient()) as any;
  let query = db
    .from("ops_tasks")
    .select(TASK_SELECT)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(300);

  const view = filter?.view ?? "active";
  if (view === "active") query = query.in("status", ACTIVE_STATUSES);
  if (view === "mine" && filter?.userId)
    query = query.in("status", ACTIVE_STATUSES).eq("assigned_to", filter.userId);
  if (view === "done") query = query.eq("status", "done");

  const { data } = await query;
  return (data ?? []) as OpsTask[];
}

export async function listMyOpenTasks(userId: string, limit = 6): Promise<OpsTask[]> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("ops_tasks")
    .select(TASK_SELECT)
    .in("status", ACTIVE_STATUSES)
    .eq("assigned_to", userId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as OpsTask[];
}

export async function countOverdueTasks(): Promise<number> {
  const db = (await createServiceClient()) as any;
  const { count } = await db
    .from("ops_tasks")
    .select("id", { count: "exact", head: true })
    .in("status", ACTIVE_STATUSES)
    .lt("due_at", new Date().toISOString());
  return count ?? 0;
}
