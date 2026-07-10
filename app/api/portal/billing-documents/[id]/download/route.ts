import { NextResponse } from "next/server";
import { requireApprovedPortalApiUser } from "@/lib/portal/api-guard";
import { isAdminRole } from "@/lib/portal/constants";
import { createServiceClient } from "@/lib/supabase/server";
import { createSafeErrorResponse, logServerError } from "@/lib/errors/user-facing-errors";
import { recordComplianceEvidence, recordSensitiveAccessEvent } from "@/lib/compliance/evidence";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireApprovedPortalApiUser();
  if (gate.response) return gate.response;
  const user = gate.user;

  const { id } = await params;
  const db = (await createServiceClient()) as any;
  const { data: document } = await db
    .from("billing_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!document) {
    return NextResponse.json(
      createSafeErrorResponse({ audience: user.role === "admin" ? "admin" : "client", area: "documents", action: "download", category: "not_found" }),
      { status: 404 },
    );
  }

  if (!isAdminRole(user.role) && document.client_id !== user.id) {
    return NextResponse.json(
      createSafeErrorResponse({ audience: "client", area: "documents", action: "download", category: "permission" }),
      { status: 403 },
    );
  }

  const { data, error } = await db.storage
    .from(document.storage_bucket)
    .download(document.storage_path);

  if (error || !data) {
    const referenceId = error ? logServerError("Billing document download failed", error, { userId: user.id, documentId: id }) : undefined;
    return NextResponse.json(
      createSafeErrorResponse({ audience: user.role === "admin" ? "admin" : "client", area: "documents", action: "download", category: "unavailable", correlationId: referenceId }),
      { status: 404 },
    );
  }

  await recordSensitiveAccessEvent({
    actor: user,
    audience: user.role,
    relatedRecordType: "billing_document",
    relatedRecordId: id,
    sensitive: true,
    metadata: {
      documentType: document.document_type,
      documentNumber: document.document_number,
      clientId: document.client_id,
    },
  });
  if (document.document_type === "invoice") {
    await recordComplianceEvidence({
      actor: user,
      audience: user.role,
      eventType: "invoice_viewed",
      eventArea: "invoices",
      relatedRecordType: "invoice",
      relatedRecordId: document.invoice_id,
      metadata: { billingDocumentId: id, documentNumber: document.document_number },
    });
  }

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": document.mime_type ?? "application/pdf",
      "Content-Disposition": `attachment; filename="${document.file_name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
