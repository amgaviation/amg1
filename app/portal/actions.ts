"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addPortalEvent,
  clearPortalSession,
  createPortalSession,
  getPortalSession,
  getSubmittedSupportRequests,
  isPortalRole,
  saveAcknowledgedQueueId,
  saveSubmittedSupportRequests,
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
