import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fileResponse } from "@/lib/portal/file-response";

/**
 * Streams a contractor-uploaded receipt file. Visible to the uploader and to
 * AMG admins (who review the vendor invoices these receipts support).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = await createServiceClient();
  const [{ data: profile }, { data: receipt }] = await Promise.all([
    db.from("profiles").select("id, role").eq("id", userId).maybeSingle(),
    db
      .from("vendor_receipts")
      .select("id, uploader_id, storage_bucket, storage_path, file_name, mime_type")
      .eq("id", id)
      .maybeSingle(),
  ]);
  if (!profile || !receipt) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  const allowed =
    profile.role === "admin" || profile.role === "super_admin" || receipt.uploader_id === userId;
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
