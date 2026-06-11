"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import {
  addPortalEvent,
  clearPortalSession,
  createPortalSession,
  getPortalSession,
  getPortalAccessRequests,
  getSubmittedSupportRequests,
  isPortalRole,
  saveAcknowledgedQueueId,
  savePortalAccessRequests,
  saveSubmittedSupportRequests,
  type PortalAccessRequest,
  type SubmittedSupportRequest,
} from "@/lib/portal-session";
import { getPortalRole, type PortalRole } from "@/lib/portal-data";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function makeReference() {
  return `REQ-${Math.floor(1100 + Math.random() * 8900)}`;
}

export async function loginToPortal(formData: FormData) {
  const roleValue = readString(formData, "role");
  const email = readString(formData, "email").toLowerCase();

  if (!isPortalRole(roleValue) || !email) {
    redirect("/login");
  }

  await createPortalSession({ email, role: roleValue });
  redirect(getPortalRole(roleValue).href);
}

export async function logoutFromPortal() {
  await clearPortalSession();
  redirect("/login");
}

export async function submitPortalAccessRequest(formData: FormData) {
  const roleValue = readString(formData, "role");
  const name = readString(formData, "name");
  const email = readString(formData, "email").toLowerCase();
  const organization = readString(formData, "organization");
  const reason = readString(formData, "reason");

  if (!isPortalRole(roleValue) || !name || !email || !organization || !reason) {
    redirect("/login?access=missing");
  }

  const requests = await getPortalAccessRequests();
  const existing = requests.find((request) => request.email === email && request.status === "pending");

  if (!existing) {
    const accessRequest: PortalAccessRequest = {
      id: `ACC-${Math.floor(200 + Math.random() * 800)}`,
      name,
      email,
      organization,
      role: roleValue,
      reason,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    await savePortalAccessRequests([accessRequest, ...requests]);
    await addPortalEvent({
      actor: email,
      role: roleValue,
      action: "Requested portal access",
      detail: `${name} requested ${getPortalRole(roleValue).title}`,
    });
  }

  revalidatePath("/login");
  revalidatePath("/portal/admin");
  redirect("/login?access=requested");
}

export async function reviewPortalAccessRequest(formData: FormData) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect(getPortalRole(session.role).href);
  }

  const id = readString(formData, "id");
  const decision = readString(formData, "decision");
  const status: PortalAccessRequest["status"] = decision === "approved" ? "approved" : "rejected";
  const requests = await getPortalAccessRequests();
  const updated = requests.map((request) =>
    request.id === id
      ? {
          ...request,
          status,
          reviewedAt: new Date().toISOString(),
          reviewedBy: session.email,
        }
      : request
  );
  const reviewed = updated.find((request) => request.id === id);

  await savePortalAccessRequests(updated);

  if (reviewed) {
    await addPortalEvent({
      actor: session.email,
      role: session.role,
      action: `${status === "approved" ? "Approved" : "Rejected"} access request`,
      detail: `${reviewed.email} / ${getPortalRole(reviewed.role).title}`,
    });
  }

  revalidatePath("/portal/admin");
  redirect("/portal/admin");
}

export async function createSupportRequest(formData: FormData) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/login");
  }

  const aircraft = readString(formData, "aircraft");
  const route = readString(formData, "route");
  const service = readString(formData, "service");
  const passengers = readString(formData, "passengers");
  const notes = readString(formData, "notes");

  if (!aircraft || !route || !service) {
    redirect(`${getPortalRole(session.role).href}?error=missing-request-fields`);
  }

  const request: SubmittedSupportRequest = {
    ref: makeReference(),
    aircraft,
    route,
    service,
    stage: "Submitted",
    nextAction: "AMG intake review",
    assigned: "AMG Operations",
    requestedBy: session.email,
    requestedAt: new Date().toISOString(),
    passengers,
    notes,
  };

  const requests = await getSubmittedSupportRequests();
  await saveSubmittedSupportRequests([request, ...requests]);
  await addPortalEvent({
    actor: session.email,
    role: session.role,
    action: "Created support request",
    detail: `${request.ref} for ${aircraft}`,
  });

  revalidatePath("/portal");
  revalidatePath("/portal/client");
  revalidatePath("/portal/admin");
  redirect(`${getPortalRole(session.role).href}?created=${request.ref}`);
}

export async function advanceSupportRequest(formData: FormData) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/login");
  }

  const ref = readString(formData, "ref");
  const stage = readString(formData, "stage");
  const nextAction = readString(formData, "nextAction");
  const requests = await getSubmittedSupportRequests();
  const updated = requests.map((request) =>
    request.ref === ref
      ? {
          ...request,
          stage: stage || request.stage,
          nextAction: nextAction || request.nextAction,
          assigned: session.role === "admin" ? "AMG Operations" : request.assigned,
        }
      : request
  );

  await saveSubmittedSupportRequests(updated);
  await addPortalEvent({
    actor: session.email,
    role: session.role,
    action: "Updated support request",
    detail: `${ref} moved to ${stage || "next stage"}`,
  });

  revalidatePath("/portal");
  revalidatePath("/portal/admin");
  revalidatePath("/portal/client");
  redirect(getPortalRole(session.role).href);
}

export async function acknowledgeQueueItem(formData: FormData) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/login");
  }

  const queueId = readString(formData, "queueId");
  const action = readString(formData, "action") || "Acknowledged";

  if (queueId) {
    await saveAcknowledgedQueueId(queueId);
    await addPortalEvent({
      actor: session.email,
      role: session.role,
      action,
      detail: `${queueId} acknowledged in ${getPortalRole(session.role).title}`,
    });
  }

  revalidatePath(getPortalRole(session.role).href);
  redirect(getPortalRole(session.role).href);
}

export async function switchPortalRole(role: PortalRole) {
  const session = await getPortalSession();

  if (!session) {
    redirect("/login");
  }

  await createPortalSession({ email: session.email, role });
  redirect(getPortalRole(role).href);
}

// ─── Supabase Auth Actions ────────────────────────────────────────────────────

export async function signInWithPassword(formData: FormData) {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=missing-credentials");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect("/login?error=invalid-credentials");
  }

  // Fetch role from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role: PortalRole = isPortalRole(profile?.role) ? (profile.role as PortalRole) : "client";

  await logAuditEvent({
    actorId: data.user.id,
    actorEmail: email,
    actorRole: role,
    action: "Signed in via Supabase",
    detail: `Entered ${getPortalRole(role).title}`,
  });

  redirect(getPortalRole(role).href);
}

export async function signOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "Signed out",
    });
  }

  await supabase.auth.signOut();
  await clearPortalSession();
  redirect("/login");
}

// ─── DB-backed Support Requests ───────────────────────────────────────────────

export async function createSupportRequestDB(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const aircraft = readString(formData, "aircraft");
  const route = readString(formData, "route");
  const service = readString(formData, "service");
  const passengers = readString(formData, "passengers");
  const notes = readString(formData, "notes");

  if (!aircraft || !route || !service) {
    redirect("/portal?error=missing-request-fields");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: PortalRole = isPortalRole(profile?.role) ? (profile.role as PortalRole) : "client";

  const { data: inserted, error } = await supabase
    .from("support_requests")
    .insert({
      aircraft_tail: aircraft,
      route,
      service,
      passengers,
      notes,
      requested_by: user.id,
      requested_by_email: user.email,
    })
    .select("ref")
    .single();

  if (error || !inserted) {
    redirect(`${getPortalRole(role).href}?error=request-failed`);
  }

  await logAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: role,
    action: "Created support request",
    detail: `${inserted.ref} for ${aircraft}`,
    entityType: "support_request",
  });

  revalidatePath("/portal");
  revalidatePath("/portal/client");
  revalidatePath("/portal/admin");
  redirect(`${getPortalRole(role).href}?created=${inserted.ref}`);
}

export async function advanceSupportRequestDB(formData: FormData) {
  const supabase = await createServiceClient();
  const anonClient = await createClient();
  const {
    data: { user },
  } = await anonClient.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = readString(formData, "id");
  const stage = readString(formData, "stage");
  const nextAction = readString(formData, "nextAction");

  const { data: profile } = await anonClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: PortalRole = isPortalRole(profile?.role) ? (profile.role as PortalRole) : "client";

  if (role !== "admin") {
    redirect(getPortalRole(role).href);
  }

  const { error } = await supabase
    .from("support_requests")
    .update({
      stage: stage || undefined,
      next_action: nextAction || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (!error) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: role,
      action: "Advanced support request stage",
      detail: `${id} moved to ${stage || "next stage"}`,
      entityType: "support_request",
      entityId: id,
    });
  }

  revalidatePath("/portal/admin");
  redirect("/portal/admin");
}

// ─── DB-backed Access Requests ────────────────────────────────────────────────

export async function submitAccessRequestDB(formData: FormData) {
  const roleValue = readString(formData, "role");
  const name = readString(formData, "name");
  const email = readString(formData, "email").toLowerCase();
  const organization = readString(formData, "organization");
  const reason = readString(formData, "reason");

  if (!isPortalRole(roleValue) || !name || !email || !organization || !reason) {
    redirect("/login?access=missing");
  }

  const supabase = await createServiceClient();
  const { error } = await supabase.from("access_requests").insert({
    name,
    email,
    organization,
    role: roleValue,
    reason,
  });

  if (error) {
    redirect("/login?access=error");
  }

  revalidatePath("/portal/admin");
  redirect("/login?access=requested");
}

export async function reviewAccessRequestDB(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/portal/admin");
  }

  const id = readString(formData, "id");
  const decision = readString(formData, "decision");
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

  revalidatePath("/portal/admin");
  redirect("/portal/admin");
}
