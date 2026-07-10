import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { listLeads } from "@/lib/portal/crm";
import { contentDisposition } from "@/lib/portal/file-response";
import { requireApprovedPortalApiUser } from "@/lib/portal/api-guard";
import { sanitizeSpreadsheetRow } from "@/lib/portal/spreadsheet";

export const dynamic = "force-dynamic";

/**
 * Bulk export of the sales pipeline. Column headers and raw stage/source
 * values round-trip cleanly through the smart importer.
 */
export async function GET(request: Request) {
  const gate = await requireApprovedPortalApiUser({ admin: true });
  if (gate.response) return gate.response;

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const leads = await listLeads({ q: url.searchParams.get("q") ?? undefined });

  const rows = leads.map((lead) =>
    sanitizeSpreadsheetRow({
      "Full Name": lead.full_name,
      Company: lead.company ?? "",
      Email: lead.email ?? "",
      Phone: lead.phone ?? "",
      Source: lead.source,
      Stage: lead.stage,
      "Estimated Value": lead.estimated_value ?? "",
      "Next Action": lead.next_action_at ?? "",
      Notes: lead.notes ?? "",
      "Lost Reason": lead.lost_reason ?? "",
      Owner: lead.owner?.full_name ?? lead.owner?.email ?? "",
      Created: lead.created_at,
      Updated: lead.updated_at,
    })
  );

  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "Full Name",
      "Company",
      "Email",
      "Phone",
      "Source",
      "Stage",
      "Estimated Value",
      "Next Action",
      "Notes",
      "Lost Reason",
      "Owner",
      "Created",
      "Updated",
    ],
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `amg-sales-pipeline-${stamp}.${format}`;

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Leads");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": contentDisposition("attachment", filename),
        "Cache-Control": "private, no-store",
      },
    });
  }

  // UTF-8 BOM keeps Excel from mangling accented characters in CSV.
  const csv = "\uFEFF" + XLSX.utils.sheet_to_csv(sheet);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": contentDisposition("attachment", filename),
      "Cache-Control": "private, no-store",
    },
  });
}
