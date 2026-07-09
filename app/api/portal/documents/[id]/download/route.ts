import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isPortalRole, isAdminRole } from "@/lib/portal/constants";
import { createSafeErrorResponse, logServerError } from "@/lib/errors/user-facing-errors";
import { isSensitiveDocumentCategory } from "@/lib/compliance/document-classification";
import { recordSensitiveAccessEvent } from "@/lib/compliance/evidence";
import { fileResponse } from "@/lib/portal/file-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      createSafeErrorResponse({ audience: "client", area: "documents", action: "download", category: "permission" }),
      { status: 401 },
    );
  }

  const db = (await createServiceClient()) as any;
  const { data: profile } = await db
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !isPortalRole(profile.role) || profile.status !== "approved") {
    return NextResponse.json(
      createSafeErrorResponse({ audience: "client", area: "documents", action: "download", category: "permission" }),
      { status: 403 },
    );
  }

  const { data: doc, error } = await db
    .from("documents")
    .select("storage_path, storage_bucket, name, original_file_name, mime_type, visibility, uploaded_by, scope_id, compliance_category, doc_type, access_level")
    .eq("id", id)
    .maybeSingle();

  if (error || !doc) {
    return NextResponse.json(
      createSafeErrorResponse({ audience: profile.role === "admin" ? "admin" : profile.role === "crew" ? "crew" : profile.role === "partner" ? "vendor" : "client", area: "documents", action: "download", category: "not_found" }),
      { status: 404 },
    );
  }

  const allowed =
    isAdminRole(profile.role) ||
    doc.visibility === "public" ||
    doc.uploaded_by === user.id ||
    doc.scope_id === user.id;
  if (!allowed) {
    return NextResponse.json(
      createSafeErrorResponse({ audience: profile.role === "crew" ? "crew" : profile.role === "partner" ? "vendor" : "client", area: "documents", action: "download", category: "permission" }),
      { status: 403 },
    );
  }

  let { data: file, error: downloadError } = await db.storage
    .from((doc as any).storage_bucket || "documents")
    .download(doc.storage_path);
  if (downloadError || !file) {
    const fallback = await db.storage
      .from("crew-credentials")
      .download(doc.storage_path);
    file = fallback.data;
    downloadError = fallback.error;
  }

  if (downloadError || !file) {
    const referenceId = downloadError ? logServerError("Portal document download failed", downloadError, { userId: user.id, documentId: id }) : undefined;
    return NextResponse.json(
      createSafeErrorResponse({ audience: profile.role === "admin" ? "admin" : profile.role === "crew" ? "crew" : profile.role === "partner" ? "vendor" : "client", area: "documents", action: "download", category: "unavailable", correlationId: referenceId }),
      { status: 500 },
    );
  }

  await recordSensitiveAccessEvent({
    actor: { id: profile.id, email: user.email ?? "", role: profile.role },
    audience: profile.role,
    relatedRecordType: "document",
    relatedRecordId: id,
    sensitive: isSensitiveDocumentCategory(doc.compliance_category ?? doc.doc_type),
    metadata: {
      category: doc.compliance_category ?? doc.doc_type ?? null,
      accessLevel: doc.access_level ?? null,
      documentName: doc.name,
    },
  });

  return fileResponse({
    file,
    filename: doc.original_file_name ?? doc.name ?? "document",
    contentType: doc.mime_type,
    disposition: "attachment",
  });
}
