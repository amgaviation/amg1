import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabase/server";
import { createSafeErrorResponse, logServerError } from "@/lib/errors/user-facing-errors";
import { fileResponse } from "@/lib/portal/file-response";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin" || user.status !== "approved") {
    return NextResponse.json(createSafeErrorResponse({ audience: "admin", area: "documents", action: "download", category: "permission" }), { status: 403 });
  }

  const { id } = await params;
  const db = (await createServiceClient()) as any;
  const { data: attachment } = await db
    .from("communication_attachments")
    .select("storage_bucket,storage_path,file_name,content_type")
    .eq("id", id)
    .maybeSingle();
  if (!attachment) {
    return NextResponse.json(createSafeErrorResponse({ audience: "admin", area: "documents", action: "download", category: "not_found" }), { status: 404 });
  }

  const { data, error } = await db.storage.from(attachment.storage_bucket).download(attachment.storage_path);
  if (error || !data) {
    const referenceId = error ? logServerError("Communication attachment content failed", error, { userId: user.id, attachmentId: id }) : undefined;
    return NextResponse.json(createSafeErrorResponse({ audience: "admin", area: "documents", action: "download", category: "unavailable", correlationId: referenceId }), { status: 500 });
  }

  return fileResponse({ file: data, filename: attachment.file_name, contentType: attachment.content_type, disposition: "inline" });
}
