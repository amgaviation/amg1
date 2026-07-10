import "server-only";

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/portal/notification-delivery";

export type StartVerificationResult =
  | "sent"
  | "cooldown"
  | "not-configured"
  | "failed";

export type ConfirmVerificationResult =
  | "verified"
  | "invalid-code"
  | "expired"
  | "too-many-attempts"
  | "no-pending"
  | "not-configured"
  | "failed";

const RESEND_COOLDOWN_MS = 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CHECK_ATTEMPTS = 5;

function cleanEnv(value?: string | null) {
  return value?.trim().replace(/^['"]|['"]$/g, "").trim() || undefined;
}

function twilioAccount() {
  const sid = cleanEnv(process.env.TWILIO_ACCOUNT_SID);
  const token = cleanEnv(process.env.TWILIO_AUTH_TOKEN);
  if (!sid || !token) return null;
  return { sid, token };
}

function verifyServiceSid() {
  return cleanEnv(process.env.TWILIO_VERIFY_SERVICE_SID);
}

function messagingConfigured() {
  return Boolean(twilioAccount() && cleanEnv(process.env.TWILIO_PHONE_NUMBER));
}

/**
 * Whether the portal can run a phone verification at all. Uses the Twilio
 * Verify service when TWILIO_VERIFY_SERVICE_SID is set; otherwise falls back
 * to a self-managed one-time code sent through the messaging number.
 */
export function phoneVerificationConfigured() {
  return Boolean(twilioAccount() && (verifyServiceSid() || messagingConfigured()));
}

/**
 * Normalize user input to E.164. Ten-digit input is treated as a US number;
 * anything else must already carry a country code.
 */
export function normalizePhoneE164(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const digits = raw.replace(/[^\d]/g, "");
  if (raw.startsWith("+")) {
    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  }
  if (digits.length === 10 && /^[2-9]/.test(digits)) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

async function twilioVerifyRequest(path: string, params: URLSearchParams) {
  const account = twilioAccount();
  const service = verifyServiceSid();
  if (!account || !service) return null;

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${service}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${account.sid}:${account.token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

function hashCode(code: string, salt: string) {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

/**
 * Save the phone on the profile and send a verification code to it. The
 * profiles trigger clears any previous verified stamp when the number changes.
 */
export async function startPhoneVerification(
  userId: string,
  phone: string,
): Promise<StartVerificationResult> {
  if (!phoneVerificationConfigured()) return "not-configured";

  const db = (await createServiceClient()) as any;
  const { data: profile } = await db
    .from("profiles")
    .select("phone, phone_verification_sent_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return "failed";

  const lastSent = profile.phone_verification_sent_at
    ? new Date(profile.phone_verification_sent_at).getTime()
    : 0;
  if (Date.now() - lastSent < RESEND_COOLDOWN_MS) return "cooldown";

  const nowIso = new Date().toISOString();

  if (verifyServiceSid()) {
    const { error } = await db
      .from("profiles")
      .update({
        phone,
        phone_verification_sent_at: nowIso,
        phone_verification_code_hash: null,
        phone_verification_expires_at: null,
        phone_verification_attempts: 0,
        updated_at: nowIso,
      })
      .eq("id", userId);
    if (error) return "failed";

    const result = await twilioVerifyRequest(
      "Verifications",
      new URLSearchParams({ To: phone, Channel: "sms" }),
    );
    if (!result?.ok) {
      console.error("[sms-verify] Twilio Verify start failed", result?.payload?.message);
      await db
        .from("profiles")
        .update({ phone_verification_sent_at: null })
        .eq("id", userId);
      return "failed";
    }
    return "sent";
  }

  // Self-managed code path: salted hash stored on the profile, plaintext only
  // in the outbound SMS.
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const salt = randomBytes(8).toString("hex");
  const { error } = await db
    .from("profiles")
    .update({
      phone,
      phone_verification_sent_at: nowIso,
      phone_verification_code_hash: `${salt}:${hashCode(code, salt)}`,
      phone_verification_expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      phone_verification_attempts: 0,
      updated_at: nowIso,
    })
    .eq("id", userId);
  if (error) return "failed";

  const delivery = await sendSms({
    to: phone,
    body: `AMG Aviation Group verification code: ${code}. It expires in 10 minutes.`,
  });
  if (delivery.status !== "sent") {
    console.error("[sms-verify] verification SMS failed", delivery.error);
    await db
      .from("profiles")
      .update({
        phone_verification_sent_at: null,
        phone_verification_code_hash: null,
        phone_verification_expires_at: null,
      })
      .eq("id", userId);
    return "failed";
  }
  return "sent";
}

/** Check a submitted code and stamp the profile verified on success. */
export async function confirmPhoneVerification(
  userId: string,
  code: string,
): Promise<ConfirmVerificationResult> {
  if (!phoneVerificationConfigured()) return "not-configured";

  const db = (await createServiceClient()) as any;
  const { data: profile } = await db
    .from("profiles")
    .select(
      "phone, phone_verification_sent_at, phone_verification_code_hash, phone_verification_expires_at, phone_verification_attempts",
    )
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.phone) return "no-pending";

  const markVerified = async () => {
    const nowIso = new Date().toISOString();
    const { error } = await db
      .from("profiles")
      .update({
        phone_verified_at: nowIso,
        phone_verification_code_hash: null,
        phone_verification_expires_at: null,
        phone_verification_attempts: 0,
        updated_at: nowIso,
      })
      .eq("id", userId);
    return error ? ("failed" as const) : ("verified" as const);
  };

  if (verifyServiceSid()) {
    if (!profile.phone_verification_sent_at) return "no-pending";
    const result = await twilioVerifyRequest(
      "VerificationCheck",
      new URLSearchParams({ To: profile.phone, Code: code }),
    );
    if (!result) return "not-configured";
    // Twilio returns 404 once a verification is expired, approved, or maxed out.
    if (result.status === 404) return "expired";
    if (!result.ok) {
      console.error("[sms-verify] Twilio Verify check failed", result.payload?.message);
      return "failed";
    }
    if (result.payload?.status !== "approved") return "invalid-code";
    return markVerified();
  }

  if (!profile.phone_verification_code_hash) return "no-pending";
  if (
    !profile.phone_verification_expires_at ||
    new Date(profile.phone_verification_expires_at).getTime() < Date.now()
  ) {
    return "expired";
  }
  if ((profile.phone_verification_attempts ?? 0) >= MAX_CHECK_ATTEMPTS) {
    return "too-many-attempts";
  }

  const [salt, storedHash] = String(profile.phone_verification_code_hash).split(":");
  const submitted = Buffer.from(hashCode(code, salt ?? ""), "hex");
  const stored = Buffer.from(storedHash ?? "", "hex");
  const matches =
    submitted.length === stored.length && timingSafeEqual(submitted, stored);

  if (!matches) {
    await db
      .from("profiles")
      .update({
        phone_verification_attempts: (profile.phone_verification_attempts ?? 0) + 1,
      })
      .eq("id", userId);
    return "invalid-code";
  }
  return markVerified();
}
