"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal/admin");

  return { user, profile };
}

export async function reviewAccessRequestDB(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/portal/admin");

  const id = String(formData.get("id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const status = decision === "approved" ? "approved" : "rejected";

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("access_requests")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: "admin",
      action: `${status === "approved" ? "Approved" : "Rejected"} access request`,
      detail: id,
      entityType: "access_request",
      entityId: id,
    });
  }

  revalidatePath("/portal/admin/users");
  redirect("/portal/admin/users");
}

export async function assignCrewToRequest(formData: FormData) {
  const { user } = await requireAdmin();

  const request_id = String(formData.get("request_id") ?? "").trim();
  const crew_id = String(formData.get("crew_id") ?? "").trim();

  if (!request_id || !crew_id) {
    redirect("/portal/admin/users?error=missing-fields");
  }

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from("assignments").insert({
    request_id,
    crew_id,
    role_on_request: "Pilot",
    status: "pending",
  });

  if (!error) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: "admin",
      action: "Assigned crew to support request",
      detail: `crew ${crew_id} → request ${request_id}`,
      entityType: "assignment",
    });
  }

  revalidatePath("/portal/admin/users");
  redirect("/portal/admin/users");
}
