import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/portal/session";
import { createCommunicationAttachmentSignedUrl } from "@/lib/portal/communications";
import { createSafeErrorResponse, logServerError } from "@/lib/errors/user-facing-errors";

export async function GET(_request: Request, { params }: { params: Promise<unknown> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin" || user.status !== "approved") {
    return NextResponse.json(
      createSafeErrorResponse({ audience: "admin", area: "documents", action: "download", category: "permission" }),
      { status: 403 },
    );
  }

  try {
    const rawParams = await params;
    const id =
      rawParams && typeof rawParams === "object" && "id" in rawParams
        ? String((rawParams as { id: unknown }).id)
        : "";
    const signedUrl = await createCommunicationAttachmentSignedUrl(id);
    if (!signedUrl) {
      return NextResponse.json(
        createSafeErrorResponse({ audience: "admin", area: "documents", action: "download", category: "not_found" }),
        { status: 404 },
      );
    }
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    const referenceId = logServerError("Communication attachment download failed", error, { userId: user.id });
    return NextResponse.json(
      createSafeErrorResponse({ audience: "admin", area: "documents", action: "download", category: "unavailable", correlationId: referenceId }),
      { status: 500 },
    );
  }
}
