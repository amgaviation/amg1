import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/portal/constants";
import { fileResponse } from "@/lib/portal/file-response";
import { requireApprovedPortalApiUser } from "@/lib/portal/api-guard";

/**
 * Streams a contractor-uploaded receipt file. Visible to the uploader and to
 * AMG admins (who review the vendor invoices these receipts support).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gate = await requireApprovedPortalApiUser();
  if (gate.response) return gate.response;
  const user = gate.user;

  const db = await createServiceClient();
  const { data: receipt } = await db
    .from("vendor_receipts")
    .select("id, uploader_id, storage_bucket, storage_path, file_name, mime_type")
    .eq("id", id)
    .maybeSingle();
  if (!receipt) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  const allowed = isAdminRole(user.role) || receipt.uploader_id === user.id;
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: file, error } = await db.storage
    .from(receipt.storage_bucket || "documents")
    .download(receipt.storage_path);
  if (error || !file) {
    return NextResponse.json({ error: "unavailable" }, { status: 404 });
  }

  return fileResponse({
    file,
    filename: receipt.file_name,
    contentType: receipt.mime_type,
    disposition: "inline",
  });
}
