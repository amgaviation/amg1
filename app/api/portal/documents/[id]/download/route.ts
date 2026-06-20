import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isPortalRole } from "@/lib/portal/constants";
import { createSafeErrorResponse, logServerError } from "@/lib/errors/user-facing-errors";
import { isSensitiveDocumentCategory } from "@/lib/compliance/document-classification";
import { recordSensitiveAccessEvent } from "@/lib/compliance/evidence";

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
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !isPortalRole(profile.role)) {
    return NextResponse.json(
      createSafeErrorResponse({ audience: "client", area: "documents", action: "download", category: "permission" }),
      { status: 403 },
    );
  }

  const { data: doc, error } = await db
    .from("documents")
    .select("storage_path, storage_bucket, name, visibility, uploaded_by, scope_id, compliance_category, doc_type, access_level")
    .eq("id", id)
    .maybeSingle();

  if (error || !doc) {
    return NextResponse.json(
      createSafeErrorResponse({ audience: profile.role === "admin" ? "admin" : profile.role === "crew" ? "crew" : profile.role === "partner" ? "vendor" : "client", area: "documents", action: "download", category: "not_found" }),
      { status: 404 },
    );
  }

  const allowed =
    profile.role === "admin" ||
    doc.visibility === "public" ||
    doc.uploaded_by === user.id ||
    doc.scope_id === user.id;
  if (!allowed) {
    return NextResponse.json(
      createSafeErrorResponse({ audience: profile.role === "crew" ? "crew" : profile.role === "partner" ? "vendor" : "client", area: "documents", action: "download", category: "permission" }),
      { status: 403 },
    );
  }

  // Generate a signed URL (60 second expiry)
  let { data: signed, error: signedError } = await supabase.storage
    .from((doc as any).storage_bucket || "documents")
    .createSignedUrl(doc.storage_path, 60);
  if (signedError || !signed) {
    const fallback = await supabase.storage
      .from("crew-credentials")
      .createSignedUrl(doc.storage_path, 60);
    signed = fallback.data;
    signedError = fallback.error;
  }

  if (signedError || !signed) {
    const referenceId = signedError ? logServerError("Portal document signed URL failed", signedError, { userId: user.id, documentId: id }) : undefined;
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

  return NextResponse.redirect(signed.signedUrl);
}
