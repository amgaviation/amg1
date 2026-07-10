import { NextResponse, type NextRequest } from "next/server";
import { requireApprovedPortalApiUser } from "@/lib/portal/api-guard";
import { createServiceClient } from "@/lib/supabase/server";
import { createSafeErrorResponse, logServerError } from "@/lib/errors/user-facing-errors";
import { logAuditEvent } from "@/lib/portal/audit";
import { fileResponse } from "@/lib/portal/file-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireApprovedPortalApiUser({ admin: true });
  if (gate.response) return gate.response;
  const user = gate.user;

  const { id } = await params;
  const db = (await createServiceClient()) as any;
  const { data: file } = await db.from("network_application_files").select("*").eq("id", id).maybeSingle();
  if (!file) {
    return NextResponse.json(createSafeErrorResponse({ audience: "admin", area: "documents", action: "download", category: "not_found" }), { status: 404 });
  }

  const { data, error } = await db.storage.from(file.storage_bucket).download(file.storage_path);
  if (error || !data) {
    const referenceId = error ? logServerError("Network application file content failed", error, { userId: user.id, fileId: id }) : undefined;
    return NextResponse.json(createSafeErrorResponse({ audience: "admin", area: "documents", action: "download", category: "unavailable", correlationId: referenceId }), { status: 404 });
  }

  await logAuditEvent({
    actor: user,
    action: "network_application_file_viewed",
    detail: file.original_filename,
    entityType: "network_application",
    entityId: file.application_id,
  });

  return fileResponse({
    file: data,
    filename: file.original_filename,
    contentType: file.content_type,
    disposition: request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline",
  });
}
