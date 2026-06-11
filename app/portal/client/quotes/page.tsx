import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listQuotesForClient } from "@/lib/portal/queries";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";

export const metadata = { title: "Quotes — Client Portal" };

export default async function ClientQuotesPage() {
  const user = await requireRole("client");
  const quotes = await listQuotesForClient(user.id);

  return (
    <PortalShell role="client" user={user}>
      <PageHeader eyebrow="Owner Services" title="Quotes & Estimates" description="AMG-provided trip estimates. Review and approve to authorize." />

      <SectionCard>
        {quotes.length === 0 ? (
          <EmptyState icon="receipt" title="No quotes on file" description="Quotes will appear here once AMG Operations generates them for your trip requests." />
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <Link
                key={q.id}
                href={`/portal/client/quotes/${q.id}`}
                className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-accent/60 sm:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <p className="font-mono text-xs text-accent">{q.ref}</p>
                  <p className="mt-1 text-sm font-semibold">{q.mission ? `Mission ${q.mission.ref}` : "General estimate"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(q.created_at)}</p>
                </div>
                <p className="text-right text-lg font-bold">${q.total.toLocaleString()}</p>
                <StatusBadge label={QUOTE_STATUS_LABEL[q.status] ?? q.status} tone={toneFor(QUOTE_STATUS_TONE, q.status)} />
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
