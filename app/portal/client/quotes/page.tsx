import { requireRolePermission } from "@/lib/portal/permissions";
import {
  EmptyState,
  PageHeader,
  RecordRow,
  SectionCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listQuotesForClient } from "@/lib/portal/queries";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Quotes - Client Portal" };

export default async function ClientQuotesPage() {
  const user = await requireRolePermission("client", "quotes");
  const quotes = await listQuotesForClient(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Owner Services"
        title="Quotes & Estimates"
        description="AMG-provided trip estimates. Review and approve to authorize."
      />

      <SectionCard>
        {quotes.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No quotes on file"
            description="Quotes will appear here once AMG Operations generates them for your trip requests."
          />
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <RecordRow
                key={q.id}
                href={`/portal/client/quotes/${q.id}`}
                refLabel={q.ref}
                title={q.mission ? `Mission ${q.mission.ref}` : "General estimate"}
                meta={formatDate(q.created_at)}
                trailing={
                  <>
                    <span className="deck-num text-base font-bold text-[var(--deck-text)]">
                      {formatMoney(q.total)}
                    </span>
                    <StatusBadge
                      label={QUOTE_STATUS_LABEL[q.status] ?? q.status}
                      tone={toneFor(QUOTE_STATUS_TONE, q.status)}
                    />
                  </>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
