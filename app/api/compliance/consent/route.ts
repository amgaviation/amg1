import { NextResponse } from "next/server";
import { CONSENT_VERSION, consentCategories } from "@/lib/compliance/consent";
import { createServiceClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/errors/user-facing-errors";
import { recordConsentEvent } from "@/lib/compliance/evidence";

const validCategoryIds = new Set(consentCategories.map((category) => category.id));

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const record = body as {
    version?: string;
    choices?: Record<string, unknown>;
    updatedAt?: string;
    source?: string;
  };

  if (record.version !== CONSENT_VERSION || !record.choices) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const choices = Object.fromEntries(
    Object.entries(record.choices)
      .filter(([key]) => validCategoryIds.has(key as (typeof consentCategories)[number]["id"]))
      .map(([key, value]) => [key, Boolean(value)]),
  );

  try {
    const db = await createServiceClient();
    const { error } = await (db as any).from("consent_events").insert({
      consent_version: record.version,
      consent_source: record.source ?? "browser",
      categories: choices,
      page_path: request.headers.get("referer"),
      user_agent: request.headers.get("user-agent"),
      gpc_enabled: request.headers.get("sec-gpc") === "1",
      ip_hash: null,
    });

    if (error) throw error;
    await recordConsentEvent({
      actorRole: "browser",
      audience: "website_visitor",
      eventType: "cookie_preferences_saved",
      relatedRecordType: "consent_event",
      policyKey: "cookie-policy",
      policyVersion: record.version,
      consentCategories: choices,
      metadata: { source: record.source ?? "browser", stored: true },
    });
    return NextResponse.json({ ok: true, stored: true });
  } catch (error) {
    logServerError("Consent event storage failed", error, { route: "/api/compliance/consent" });
    await recordConsentEvent({
      actorRole: "browser",
      audience: "website_visitor",
      eventType: "cookie_preferences_saved",
      relatedRecordType: "consent_event",
      policyKey: "cookie-policy",
      policyVersion: record.version,
      consentCategories: choices,
      metadata: { source: record.source ?? "browser", stored: false },
    });
    return NextResponse.json({ ok: true, stored: false });
  }
}
