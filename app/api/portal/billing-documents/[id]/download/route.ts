import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabase/server";
import { createSafeErrorResponse, logServerError } from "@/lib/errors/user-facing-errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.status !== "approved") {
    return NextResponse.json(
      createSafeErrorResponse({ audience: "client", area: "documents", action: "download", category: "permission" }),
      { status: 401 },
    );
  }

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

  if (user.role !== "admin" && document.client_id !== user.id) {
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

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": document.mime_type ?? "application/pdf",
      "Content-Disposition": `attachment; filename="${document.file_name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
