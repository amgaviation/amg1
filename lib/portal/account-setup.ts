import "server-only";

import { passwordSetupRedirectUrl } from "@/lib/auth/urls";
import { amgEmailLayout } from "@/lib/portal/email-templates";
import { sendEmail } from "@/lib/portal/notification-delivery";
import { createServiceClient } from "@/lib/supabase/server";

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

type PortalAccountProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  company_name?: string | null;
  phone?: string | null;
  home_base?: string | null;
  permissions?: string[] | null;
};

export async function findAuthUserIdByEmail(email: string) {
  const db = await createServiceClient();
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) return null;

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

export async function generatePortalPasswordSetupLink(email: string) {
  const db = await createServiceClient();
  const { data, error } = await db.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: passwordSetupRedirectUrl() },
  });

  if (error) return null;
  return data.properties?.action_link ?? null;
}

export async function sendPortalAccountSetupEmail(input: {
  email: string;
  name: string;
  role?: string | null;
  setupLink: string;
  subject?: string;
}) {
  const subject = input.subject ?? "Set up your AMG portal access";
  const roleLabel = input.role ? input.role.replace(/_/g, " ") : "portal";
  const text = [
    `Hello ${input.name},`,
    `AMG Operations has prepared ${roleLabel} access for this email address.`,
    `Use this secure setup link to create your password: ${input.setupLink}`,
    "For security, this link expires. If it no longer works, ask AMG Operations to send a new setup link.",
  ].join("\n\n");

  return sendEmail({
    to: input.email,
    subject,
    text,
    html: amgEmailLayout({
      previewText: "Your AMG portal access is ready.",
      eyebrow: "AMG Portal Access",
      title: "Your AMG portal access is ready",
      intro: `Hello ${input.name}, AMG Operations has prepared secure ${roleLabel} access for this email address.`,
      sections: [
        {
          title: "Secure Setup",
          body:
            "Use the button below to create your AMG portal password. After setup, sign in with this email address.",
        },
        {
          title: "Security Note",
          body:
            "This setup link expires. If you did not expect portal access from AMG Aviation Group, ignore this email or contact AMG Operations.",
        },
      ],
      cta: { label: "Set Up Portal Access", href: input.setupLink },
      footerNote:
        "AMG Operations controls portal access. Portal visibility does not replace operational approval, trip acceptance, or aircraft movement authorization.",
    }),
  });
}

export async function sendPortalPasswordResetEmail(input: {
  email: string;
  name: string;
  setupLink: string;
}) {
  const text = [
    `Hello ${input.name},`,
    "AMG Operations sent this secure password reset link for your portal account.",
    `Reset your password here: ${input.setupLink}`,
    "For security, this link expires. If you did not request help, contact AMG Operations.",
  ].join("\n\n");

  return sendEmail({
    to: input.email,
    subject: "Reset your AMG portal password",
    text,
    html: amgEmailLayout({
      previewText: "Reset your AMG portal password.",
      eyebrow: "Account Security",
      title: "Reset your AMG portal password",
      intro:
        `Hello ${input.name}, AMG Operations sent this secure password reset link for your portal account.`,
      sections: [
        {
          title: "Security Note",
          body:
            "Use the button below to choose a new password. If you did not request password help, contact AMG Operations and do not use this link.",
        },
      ],
      cta: { label: "Reset Password", href: input.setupLink },
      footerNote:
        "AMG will never ask for your password by email. This message does not include internal account IDs or reset tokens.",
    }),
  });
}

export async function ensurePortalAuthUserForProfile(input: {
  db: ServiceClient;
  profile: PortalAccountProfile;
  invitedBy?: string | null;
  sendSetupEmail?: boolean;
}) {
  const { db, profile } = input;
  const email = profile.email.toLowerCase();
  let authUserId = await findAuthUserIdByEmail(email);

  if (!authUserId) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: profile.full_name ?? email,
        role: profile.role,
      },
    });

    if (error || !data.user) {
      return { ok: false as const, profileId: profile.id, reason: error?.message ?? "auth_create_failed" };
    }

    authUserId = data.user.id;
  }

  const now = new Date().toISOString();
  const nextProfile = {
    id: authUserId,
    email,
    full_name: profile.full_name,
    role: profile.role,
    status: "approved",
    is_active: true,
    company_name: profile.company_name ?? null,
    phone: profile.phone ?? null,
    home_base: profile.home_base ?? null,
    permissions: profile.permissions ?? null,
    invitation_status: input.sendSetupEmail === false ? profile.status : "portal_setup_pending",
    invitation_channel: input.sendSetupEmail === false ? null : "email",
    invited_by: input.invitedBy ?? null,
    updated_at: now,
  };

  const { error: profileError } = await db.from("profiles").upsert(nextProfile);
  if (profileError) {
    return { ok: false as const, profileId: profile.id, reason: profileError.message };
  }

  if (authUserId !== profile.id) {
    await db.from("profiles").delete().eq("id", profile.id);
  }

  if (input.sendSetupEmail !== false) {
    const setupLink = await generatePortalPasswordSetupLink(email);
    if (!setupLink) {
      await db
        .from("profiles")
        .update({ invitation_status: "portal_setup_failed", updated_at: now })
        .eq("id", authUserId);
      return { ok: false as const, profileId: authUserId, reason: "setup_link_failed" };
    }

    const result = await sendPortalAccountSetupEmail({
      email,
      name: profile.full_name ?? email,
      role: profile.role,
      setupLink,
    });

    await db
      .from("profiles")
      .update({
        invitation_status: result.status === "sent" ? "portal_setup_sent" : "portal_setup_failed",
        invitation_channel: "email",
        invitation_sent_at: result.status === "sent" ? new Date().toISOString() : null,
        invited_by: input.invitedBy ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUserId);

    if (result.status !== "sent") {
      return { ok: false as const, profileId: authUserId, reason: result.error ?? "email_failed" };
    }
  }

  return { ok: true as const, profileId: authUserId };
}
