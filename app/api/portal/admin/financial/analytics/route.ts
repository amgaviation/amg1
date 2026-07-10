import { getFinancialAnalytics, type AnalyticsRangeKey } from "@/lib/portal/financial-analytics";
import { privateJson, requireApprovedPortalApiUser } from "@/lib/portal/api-guard";

export async function GET(request: Request) {
  const gate = await requireApprovedPortalApiUser({ admin: true });
  if (gate.response) return gate.response;

  const url = new URL(request.url);
  const data = await getFinancialAnalytics({
    range: (url.searchParams.get("range") as AnalyticsRangeKey | null) ?? "month_to_date",
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  return privateJson(data);
}
