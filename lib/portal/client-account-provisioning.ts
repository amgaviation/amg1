import "server-only";

import { amgEmailLayout } from "@/lib/portal/email-templates";
import { sendEmail } from "@/lib/portal/notification-delivery";
import { createServiceClient } from "@/lib/supabase/server";

type PublicSupportRequest = {
  id: string;
  mission_id: string;
  client_id: string | null;
  requester_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  portal_account_status: string | null;
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function origin() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "";
  if (!appUrl) return "";
  return appUrl.startsWith("http") ? appUrl.replace(/\/+$/, "") : `https://${appUrl.replace(/\/+$/, "")}`;
}

function extractFromNotes(notes?: string | null) {
  if (!notes) return null;
  const email = notes.match(/Email:\s*([^\s<>]+@[^\s<>]+)/i)?.[1] || notes.match(EMAIL_RE)?.[0];
  if (!email) return null;
  const requesterName = notes.match(/Requester:\s*(.+)/i)?.[1]?.split("\n")[0]?.trim() || email;
  const phone = notes.match(/Phone:\s*(.+)/i)?.[1]?.split("\n")[0]?.trim() || null;
  const companyName = notes.match(/Organization:\s*(.+)/i)?.[1]?.split("\n")[0]?.trim() || null;
  return { email: email.toLowerCase(), requesterName, phone, companyName };
}

async function findPublicRequest(missionId: string): Promise<PublicSupportRequest | null> {
  const db = await createServiceClient();
  const { data } = await (db as any)
    .from("public_support_requests")
    .select("id, mission_id, client_id, requester_name, email, phone, company_name, portal_account_status")
    .eq("mission_id", missionId)
    .maybeSingle();
  return data ?? null;
}

async function makeRecoveryLink(email: string) {
  const db = await createServiceClient();
  const base = origin();
  const redirectTo = base ? `${base}/auth/password-setup` : undefined;
  const { data, error } = await db.auth.admin.generateLink({
    type: "recovery",
    email,
    options: redirectTo ? { redirectTo } : undefined,
  });

  if (error) {
    console.error("[client-provisioning] failed to generate recovery link", { email, error });
    return null;
  }

  return data.properties?.action_link ?? null;
}

async function sendPortalSetupEmail(params: {
  email: string;
  name: string;
  missionRef: string;
  setupLink: string | null;
}) {
  const base = origin();
  const fallbackLogin = base ? `${base}/login` : undefined;
  const link = params.setupLink || fallbackLogin;

  const text = [
    `Hello ${params.name},`,
    `AMG Aviation Group has moved your request ${params.missionRef} into review and created a client portal profile for this email address.`,
    params.setupLink
      ? `Use this secure link to create your password and access the portal: ${params.setupLink}`
      : fallbackLogin
        ? `Go to ${fallbackLogin} and use the forgot password option to create your password.`
        : `Use the AMG portal login page and select forgot password to create your password.`,
    `AMG will continue to confirm scope, availability, pricing, crew assignment, aircraft movement, and operational acceptance separately.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await sendEmail({
    to: params.email,
    subject: `AMG Aviation Group portal access for ${params.missionRef}`,
    text,
    html: amgEmailLayout({
      previewText: `Portal access created for ${params.missionRef}`,
      eyebrow: "Client Portal Access",
      title: "Your AMG client portal access is ready",
      intro:
        "AMG Aviation Group has moved your request into review and created a secure client portal profile for this email address.",
      reference: params.missionRef,
      status: "Under Review",
      sections: [
        {
          title: "Login Instructions",
          body: params.setupLink
            ? "Use the secure setup link below to create your password. After your password is created, you can sign in to the AMG portal with the same email address used on your support request."
            : "Use the AMG portal login page and choose forgot password to create your password for this email address.",
        },
        {
          title: "Next Steps",
          body:
            "AMG Operations will continue reviewing your request and will contact you if additional details or approvals are needed. Portal access does not constitute mission acceptance, aircraft movement authorization, or a binding service commitment.",
        },
      ],
      cta: link
        ? {
            label: params.setupLink ? "Create Portal Password" : "Open Portal Login",
            href: link,
          }
        : undefined,
      footerNote:
        "For urgent updates or corrections, reply to this email or contact AMG Aviation Group at information@amgaviationgroup.com.",
    }),
    replyTo: process.env.EMAIL_REPLY_TO,
  });

  if (result.status !== "sent") {
    console.error("[client-provisioning] portal setup email failed", {
      email: params.email,
      missionRef: params.missionRef,
      status: result.status,
      error: result.error,
    });
  }
}

export async function ensureClientAccountForMission(missionId: string, actorId?: string | null) {
  try {
    const db = await createServiceClient();
    const { data: mission } = await db
      .from("missions")
      .select("id, ref, client_id, client_notes")
      .eq("id", missionId)
      .maybeSingle();

    if (!mission) return;

    const structured = await findPublicRequest(missionId);
    const fallback = extractFromNotes(mission.client_notes);

    const email = (structured?.email || fallback?.email || "").toLowerCase();
    if (!email) return;

    const requesterName = structured?.requester_name || fallback?.requesterName || email;
    const phone = structured?.phone || fallback?.phone || null;
    const companyName = structured?.company_name || fallback?.companyName || null;

    const { data: existingProfile } = await db
      .from("profiles")
      .select("id, email, full_name, role, status")
      .ilike("email", email)
      .maybeSingle();

    let profileId = existingProfile?.id ?? null;
    let createdNewProfile = false;

    if (!profileId) {
      const { data: created, error: createError } = await db.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: requesterName,
          role: "client",
        },
      });

      if (createError || !created.user) {
        console.error("[client-provisioning] auth user creation failed", { email, createError });
        return;
      }

      profileId = created.user.id;
      createdNewProfile = true;
    }

    await db.from("profiles").upsert({
      id: profileId,
      email,
      full_name: existingProfile?.full_name || requesterName,
      role: existingProfile?.role || "client",
      status: existingProfile?.status === "suspended" ? "suspended" : "approved",
      is_active: existingProfile?.status !== "suspended",
      company_name: companyName,
      phone,
      invitation_status: createdNewProfile ? "portal_setup_sent" : "existing_account_linked",
      invitation_channel: "email",
      invitation_sent_at: new Date().toISOString(),
      invited_by: actorId ?? null,
    });

    await db.from("missions").update({ client_id: profileId }).eq("id", missionId);

    if (structured) {
      await (db as any)
        .from("public_support_requests")
        .update({
          client_id: profileId,
          portal_account_status: createdNewProfile ? "created" : "existing_account_linked",
          portal_account_user_id: profileId,
          portal_invitation_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", structured.id);
    }

    const setupLink = await makeRecoveryLink(email);
    await sendPortalSetupEmail({
      email,
      name: requesterName,
      missionRef: mission.ref,
      setupLink,
    });
  } catch (error) {
    console.error("[client-provisioning] failed", { missionId, error });
  }
}
