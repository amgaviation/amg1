"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import {
  normalizeContactSubmission,
  normalizeSupportSubmission,
  saveAndEmailSubmission,
  type PublicFormRequestContext,
} from "@/lib/public-form-submissions";
import { detectProhibitedPaymentData } from "@/lib/compliance/payment-data-guard";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";
import { notifyAdmins } from "@/lib/portal/audit";
import {
  createInquiryReference,
  PUBLIC_INQUIRY_SERVICE_BY_VALUE,
  validateServiceInquiryFormData,
  type FieldErrors,
  type NormalizedServiceInquiry,
} from "@/lib/public-inquiries";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type ServiceInquiryActionState = {
  status: "idle" | "validation_error" | "error" | "success" | "duplicate";
  fieldErrors?: FieldErrors;
  formError?: string;
  reference?: string;
  serviceLabel?: string;
  values?: Record<string, string | string[]>;
};

function paymentGuardRedirect(formData: FormData, destination: "/contact" | "/request-support") {
  const findings = detectProhibitedPaymentData({
    message: String(formData.get("message") ?? ""),
    requested_support_summary: String(formData.get("requested_support_summary") ?? ""),
    additional_notes: String(formData.get("additional_notes") ?? ""),
    operational_summary: String(formData.get("operational_summary") ?? ""),
    company_operator: String(formData.get("company_operator") ?? ""),
  });

  if (!findings.length) return;

  void recordComplianceEvidence({
    actorRole: "public",
    audience: "public_form_submitter",
    eventType: "no_online_payment_notice_acknowledged",
    eventArea: "security",
    policyKey: "no-online-payment-notice",
    metadata: { destination, fields: findings.map((finding) => finding.field), findingTypes: findings.map((finding) => finding.type) },
  });
  redirect(`${destination}?error=payment-data`);
}

async function requestContext(): Promise<PublicFormRequestContext> {
  const requestHeaders = await headers();
  const referrer = requestHeaders.get("referer");
  return {
    sourceUrl: referrer,
    referrer,
    userAgent: requestHeaders.get("user-agent"),
  };
}

function formValues(formData: FormData) {
  const values: Record<string, string | string[]> = {};
  for (const [key, raw] of formData.entries()) {
    if (key === "website" || key === "idempotency_key") continue;
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value) continue;
    const existing = values[key];
    if (Array.isArray(existing)) existing.push(value);
    else if (typeof existing === "string") values[key] = [existing, value];
    else values[key] = value;
  }
  return values;
}

function stablePayloadHash(inquiry: NormalizedServiceInquiry) {
  return createHash("sha256")
    .update(JSON.stringify({
      serviceType: inquiry.serviceType,
      email: inquiry.email,
      phone: inquiry.phone,
      organization: inquiry.organization,
      urgency: inquiry.urgency,
      aircraftIdentifier: inquiry.aircraftIdentifier,
      origin: inquiry.origin,
      destination: inquiry.destination,
      requestedDate: inquiry.requestedDate,
      timeframe: inquiry.timeframe,
      summary: inquiry.summary,
      serviceDetails: inquiry.serviceDetails,
      context: inquiry.context,
    }))
    .digest("hex");
}

function notificationBody(reference: string, inquiry: NormalizedServiceInquiry) {
  const config = PUBLIC_INQUIRY_SERVICE_BY_VALUE[inquiry.serviceType];
  const details = Object.entries(inquiry.serviceDetails)
    .filter(([, value]) => Array.isArray(value) ? value.length > 0 : value !== "" && value !== null && value !== undefined)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join("\n");

  return [
    "New public service inquiry received.",
    `Reference: ${reference}`,
    `Service: ${config.label}`,
    `Assigned team: ${inquiry.assignedTeam}`,
    `Urgency: ${inquiry.urgency}`,
    `Requester: ${inquiry.requesterName}`,
    `Email: ${inquiry.email}`,
    inquiry.phone ? `Phone: ${inquiry.phone}` : null,
    inquiry.organization ? `Organization: ${inquiry.organization}` : null,
    inquiry.aircraftIdentifier ? `Aircraft: ${inquiry.aircraftIdentifier}` : null,
    inquiry.origin ? `Origin: ${inquiry.origin}` : null,
    inquiry.destination ? `Destination: ${inquiry.destination}` : null,
    inquiry.requestedDate ? `Requested date: ${inquiry.requestedDate}` : null,
    inquiry.timeframe ? `Timeframe: ${inquiry.timeframe}` : null,
    inquiry.context.source ? `Source: ${inquiry.context.source}` : null,
    inquiry.context.plan ? `Plan context: ${inquiry.context.plan}` : null,
    inquiry.context.aircraftCategory ? `Aircraft category context: ${inquiry.context.aircraftCategory}` : null,
    details ? `Service details:\n${details}` : null,
    inquiry.summary ? `Brief details:\n${inquiry.summary}` : null,
  ].filter(Boolean).join("\n");
}

async function recordInquiryAudit(inquiryId: string, reference: string, inquiry: NormalizedServiceInquiry) {
  try {
    const db = await createServiceClient();
    await db.from("audit_events").insert({
      actor_id: null,
      actor_email: inquiry.email,
      actor_role: "public",
      action: "service_inquiry_submitted",
      detail: `Public service inquiry ${reference} submitted for ${inquiry.serviceLabel}.`,
      entity_type: "service_inquiry",
      entity_id: inquiryId,
    });
  } catch (error) {
    console.error("[service-inquiry] audit insert failed", error);
  }
}

export async function submitPublicServiceInquiry(
  _previousState: ServiceInquiryActionState,
  formData: FormData,
): Promise<ServiceInquiryActionState> {
  if (String(formData.get("website") ?? "").trim()) {
    return { status: "success", reference: "AMG-INQ-RECEIVED", serviceLabel: "Service Inquiry" };
  }

  const findings = detectProhibitedPaymentData({ message: String(formData.get("summary") ?? "") });
  if (findings.length) {
    return {
      status: "validation_error",
      formError: "Remove full card numbers, CVV codes, bank account numbers, or routing numbers before submitting.",
      values: formValues(formData),
    };
  }

  const normalized = validateServiceInquiryFormData(formData);
  if (!normalized.ok) {
    return {
      status: "validation_error",
      fieldErrors: normalized.fieldErrors,
      formError: normalized.formError ?? "Review the highlighted fields and submit again.",
      values: formValues(formData),
    };
  }

  const inquiry = normalized.inquiry;
  const payloadHash = stablePayloadHash(inquiry);

  try {
    const db = await createServiceClient();
    const existingByToken = await db
      .from("service_inquiries")
      .select("id, reference")
      .eq("idempotency_key", inquiry.idempotencyKey)
      .maybeSingle();

    if (existingByToken.data?.reference) {
      return { status: "duplicate", reference: existingByToken.data.reference, serviceLabel: inquiry.serviceLabel, values: formValues(formData) };
    }

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const duplicate = await db
      .from("service_inquiries")
      .select("id, reference")
      .eq("email", inquiry.email)
      .eq("service_type", inquiry.serviceType)
      .eq("payload_hash", payloadHash)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (duplicate.data?.reference) {
      return { status: "duplicate", reference: duplicate.data.reference, serviceLabel: inquiry.serviceLabel, values: formValues(formData) };
    }

    const rate = await db
      .from("service_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("email", inquiry.email)
      .gte("created_at", since);
    if ((rate.count ?? 0) >= 5) {
      return {
        status: "error",
        formError: "AMG received several recent inquiries from this email address. Please wait before submitting another inquiry.",
        values: formValues(formData),
      };
    }

    const reference = createInquiryReference();
    const { data, error } = await db
      .from("service_inquiries")
      .insert({
        reference,
        status: "new",
        service_type: inquiry.serviceType,
        assigned_team: inquiry.assignedTeam,
        source: inquiry.context.source,
        requester_name: inquiry.requesterName,
        email: inquiry.email,
        phone: inquiry.phone,
        organization: inquiry.organization,
        urgency: inquiry.urgency,
        aircraft_identifier: inquiry.aircraftIdentifier,
        origin: inquiry.origin,
        destination: inquiry.destination,
        requested_date: inquiry.requestedDate,
        timeframe: inquiry.timeframe,
        summary: inquiry.summary,
        service_details: inquiry.serviceDetails as Json,
        context: inquiry.context as Json,
        idempotency_key: inquiry.idempotencyKey,
        payload_hash: payloadHash,
      })
      .select("id, reference")
      .single();

    if (error || !data?.id) {
      console.error("[service-inquiry] insert failed", { serviceType: inquiry.serviceType, error });
      return { status: "error", formError: "AMG could not store the inquiry. Please try again or contact AMG directly.", values: formValues(formData) };
    }

    await Promise.all([
      notifyAdmins({
        title: `${inquiry.urgency === "standard" ? "New" : "Urgent"} ${inquiry.serviceLabel} Inquiry`,
        body: notificationBody(data.reference, inquiry),
        type: inquiry.urgency === "standard" ? "service_inquiry" : "urgent_service_inquiry",
        entityType: "service_inquiry",
        entityId: data.id,
        replyTo: inquiry.email,
      }),
      recordInquiryAudit(data.id, data.reference, inquiry),
    ]);

    return { status: "success", reference: data.reference, serviceLabel: inquiry.serviceLabel };
  } catch (error) {
    console.error("[service-inquiry] submission failed", { serviceType: inquiry.serviceType, error });
    return { status: "error", formError: "AMG could not store the inquiry. Please try again or contact AMG directly.", values: formValues(formData) };
  }
}

export async function submitContactInquiry(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/contact?success=1");
  }
  paymentGuardRedirect(formData, "/contact");

  const normalized = normalizeContactSubmission(formData);
  if (!normalized.ok) redirect("/contact?error=missing");

  const result = await saveAndEmailSubmission(normalized.submission, await requestContext());
  if (!result.ok) redirect(`/contact?error=${result.reason}`);

  redirect("/contact?success=1");
}

export async function submitSupportRequest(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) {
    redirect("/request-support?success=1");
  }
  paymentGuardRedirect(formData, "/request-support");

  const normalized = normalizeSupportSubmission(formData);
  if (!normalized.ok) redirect("/request-support?error=missing");

  const result = await saveAndEmailSubmission(normalized.submission, await requestContext());
  if (!result.ok) redirect(`/request-support?error=${result.reason}`);

  redirect("/request-support?success=1");
}

// Backward-compatible export for the legacy public support form component.
export async function submitPublicSupportRequest(formData: FormData) {
  return submitSupportRequest(formData);
}
