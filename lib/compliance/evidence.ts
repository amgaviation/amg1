import "server-only";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/errors/user-facing-errors";
import { COMPLIANCE_POLICY_VERSION } from "@/lib/compliance/config";
import type { ConsentState } from "@/lib/compliance/consent";
import type { SessionUser } from "@/lib/portal/session";

export type EvidenceEventType =
  | "terms_accepted"
  | "privacy_acknowledged"
  | "portal_terms_accepted"
  | "document_terms_acknowledged"
  | "credential_notice_acknowledged"
  | "support_request_disclaimer_acknowledged"
  | "quote_terms_acknowledged"
  | "invoice_terms_acknowledged"
  | "marketing_consent_given"
  | "marketing_consent_revoked"
  | "sms_consent_given"
  | "sms_consent_revoked"
  | "cookie_preferences_saved"
  | "privacy_request_submitted"
  | "document_uploaded"
  | "document_downloaded"
  | "sensitive_document_viewed"
  | "document_visibility_changed"
  | "document_deleted_or_archived"
  | "role_changed"
  | "admin_access_review_completed"
  | "support_request_submitted"
  | "quote_approved"
  | "invoice_viewed"
  | "payment_marked_paid"
  | "emergency_disclaimer_acknowledged"
  | "no_online_payment_notice_acknowledged";

export type EvidenceEventArea =
  | "public_site"
  | "request_support"
  | "client_portal"
  | "crew_portal"
  | "vendor_portal"
  | "admin_portal"
  | "documents"
  | "credentials"
  | "billing"
  | "quotes"
  | "invoices"
  | "communications"
  | "privacy"
  | "cookies"
  | "marketing"
  | "sms"
  | "security"
  | "compliance";

export type ComplianceActor = Pick<SessionUser, "id" | "email" | "role"> | null;

export type ComplianceEvidenceInput = {
  actor?: ComplianceActor;
  actorEmail?: string | null;
  actorRole?: string | null;
  audience: string;
  eventType: EvidenceEventType;
  eventArea: EvidenceEventArea;
  relatedRecordType?: string | null;
  relatedRecordId?: string | null;
  policyKey?: string | null;
  policyVersion?: string | null;
  acknowledgmentText?: string | null;
  consentCategories?: ConsentState | Record<string, unknown> | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
};

function publicId() {
  return `ce_${crypto.randomUUID().replace(/-/g, "")}`;
}

function cleanText(value: string | null | undefined, limit = 2000) {
  if (!value) return null;
  return value.replace(/\u0000/g, "").trim().slice(0, limit) || null;
}

function safeMetadata(metadata: Record<string, unknown> | undefined) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (/secret|token|password|key|card|cvv|account|routing|ach/i.test(key)) {
      output[key] = "[redacted]";
    } else if (typeof value === "string") {
      output[key] = value.slice(0, 500);
    } else if (typeof value === "number" || typeof value === "boolean" || value === null) {
      output[key] = value;
    } else {
      output[key] = JSON.parse(JSON.stringify(value)).toString?.() === "[object Object]" ? value : String(value).slice(0, 500);
    }
  }
  return output;
}

async function requestMetadata() {
  try {
    const h = await headers();
    return {
      userAgent: h.get("user-agent"),
      ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"),
    };
  } catch {
    return { userAgent: null, ipAddress: null };
  }
}

export async function recordComplianceEvidence(input: ComplianceEvidenceInput) {
  if (!input.audience || !input.eventType || !input.eventArea) return;

  try {
    const db = await createServiceClient();
    const request = await requestMetadata();
    await (db as any).from("compliance_evidence_events").insert({
      public_id: publicId(),
      actor_user_id: input.actor?.id ?? null,
      actor_email: input.actor?.email ?? input.actorEmail ?? null,
      actor_role: input.actor?.role ?? input.actorRole ?? null,
      audience: cleanText(input.audience, 120),
      event_type: input.eventType,
      event_area: input.eventArea,
      related_record_type: input.relatedRecordType ?? null,
      related_record_id: input.relatedRecordId ?? null,
      policy_key: input.policyKey ?? null,
      policy_version: input.policyVersion ?? COMPLIANCE_POLICY_VERSION,
      acknowledgment_text: cleanText(input.acknowledgmentText, 2000),
      consent_categories: input.consentCategories ?? null,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      session_id: cleanText(input.sessionId, 160),
      metadata: safeMetadata(input.metadata),
    });
  } catch (error) {
    logServerError("Compliance evidence logging failed", error, {
      eventType: input.eventType,
      eventArea: input.eventArea,
      relatedRecordType: input.relatedRecordType ?? null,
      relatedRecordId: input.relatedRecordId ?? null,
    });
  }
}

export function recordAcknowledgment(input: Omit<ComplianceEvidenceInput, "eventType"> & { eventType: EvidenceEventType }) {
  return recordComplianceEvidence(input);
}

export function recordConsentEvent(input: Omit<ComplianceEvidenceInput, "eventArea">) {
  return recordComplianceEvidence({ ...input, eventArea: input.eventType.startsWith("sms") ? "sms" : input.eventType.startsWith("marketing") ? "marketing" : "cookies" });
}

export function recordSensitiveAccessEvent(input: Omit<ComplianceEvidenceInput, "eventType" | "eventArea"> & { sensitive?: boolean }) {
  return recordComplianceEvidence({
    ...input,
    eventType: input.sensitive ? "sensitive_document_viewed" : "document_downloaded",
    eventArea: "documents",
  });
}

export function recordPortalTermsAcceptance(input: Omit<ComplianceEvidenceInput, "eventType" | "eventArea">) {
  return recordComplianceEvidence({ ...input, eventType: "portal_terms_accepted", eventArea: "compliance" });
}

export function recordSupportRequestDisclaimerAcknowledgment(input: Omit<ComplianceEvidenceInput, "eventType" | "eventArea">) {
  return recordComplianceEvidence({
    ...input,
    eventType: "support_request_disclaimer_acknowledged",
    eventArea: "request_support",
  });
}
