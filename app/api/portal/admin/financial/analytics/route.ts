import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/portal/constants";
import { getFinancialAnalytics, type AnalyticsRangeKey } from "@/lib/portal/financial-analytics";
import { getSessionUser } from "@/lib/portal/session";
import { privateJson } from "@/lib/portal/api-guard";

export async function GET(request: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(user.role) || user.status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const data = await getFinancialAnalytics({
    range: (url.searchParams.get("range") as AnalyticsRangeKey | null) ?? "month_to_date",
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  return privateJson(data);
}
