import { NextResponse } from "next/server";
import { requireApprovedPortalApiUser } from "@/lib/portal/api-guard";
import { can } from "@/lib/portal/permissions";
import { fileResponse } from "@/lib/portal/file-response";
import { downloadBriefing, getMissionBriefing } from "@/lib/portal/mission-briefings";

/**
 * Serve a stored route briefing PDF inline.
 *
 * Admin-only via the flight_intel module — briefings aggregate operational
 * intelligence across a mission, and are not client- or crew-facing documents
 * in the way an invoice is.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApprovedPortalApiUser({ admin: true });
  if ("response" in guard) return guard.response;
  if (!(await can(guard.user.role, "flight_intel", "view"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const row = await getMissionBriefing(id).catch(() => null);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const file = await downloadBriefing(row);
  if (!file) return NextResponse.json({ error: "File unavailable" }, { status: 404 });

  return fileResponse({
    file,
    filename: row.file_name,
    contentType: row.mime_type ?? "application/pdf",
    disposition: "inline",
  });
}
