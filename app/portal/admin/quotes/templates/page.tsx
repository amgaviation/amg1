import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard, EmptyState } from "@/components/portal/ui/primitives";
import { DataTable } from "@/components/portal/ui/data-table";
import { TextField, TextAreaField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { LineItemsEditor } from "@/components/portal/admin/line-items-editor";
import { listQuoteTemplates, type QuoteTemplateSummary } from "@/lib/portal/quote-templates";
import { createQuoteTemplate, deleteQuoteTemplate } from "@/app/portal/actions/quote-templates";
import { BILLING_COST_TYPES, QUOTE_CATEGORIES } from "@/lib/portal/constants";

export const metadata = { title: "Quote Templates - Admin Portal" };

type Params = { success?: string; error?: string };

const NOTICE: Record<string, { tone: "ok" | "err"; text: string }> = {
  created: { tone: "ok", text: "Template saved. It is now available on the New Quote page." },
  deleted: { tone: "ok", text: "Template deleted." },
  name: { tone: "err", text: "A template name is required." },
  save: { tone: "err", text: "Could not save the template. Please try again." },
  missing: { tone: "err", text: "That template no longer exists." },
};

export default async function QuoteTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "quotes", "edit");
  const params = await searchParams;
  const templates = await listQuoteTemplates();
  const noticeKey = params.success ?? params.error;
  const notice = noticeKey ? NOTICE[noticeKey] : null;

  return (
    <>
      <PageHeader
        eyebrow="AMG Billing"
        title="Quote Templates"
        description="Save reusable line-item bundles, then start a new quote from one in a single click."
        actions={
          <Link href="/portal/admin/quotes" className="text-xs text-[var(--deck-text-2)] hover:text-[var(--deck-accent-ink)]">
            Back to quotes
          </Link>
        }
      />

      {notice ? (
        <div
          role="status"
          className={
            notice.tone === "ok"
              ? "rounded-md border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] px-4 py-3 text-sm text-[var(--deck-accent-ink)]"
              : "rounded-md border border-[var(--deck-danger-line)] bg-[var(--deck-danger-tint)] px-4 py-3 text-sm text-[var(--deck-danger)]"
          }
        >
          {notice.text}
        </div>
      ) : null}

      <SectionCard title="Saved Templates" icon="receipt" description={`${templates.length} ${templates.length === 1 ? "template" : "templates"}`}>
        {templates.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No templates yet"
            description="Create a reusable line-item bundle below — recurring crew, positioning, or handling packages you quote often."
          />
        ) : (
          <DataTable<QuoteTemplateSummary>
            rows={templates}
            getKey={(row) => row.id}
            emptyLabel="No templates."
            columns={[
              {
                header: "Name",
                priority: "primary",
                cell: (row) => (
                  <span className="font-medium text-[var(--deck-text)]">{row.name}</span>
                ),
              },
              {
                header: "Lines",
                align: "right",
                cell: (row) => <span className="deck-num">{row.lineItemCount}</span>,
              },
              {
                header: "Description",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="text-[var(--deck-text-2)]">{row.description || "—"}</span>
                ),
              },
              {
                header: "",
                align: "right",
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/portal/admin/quotes/new?template=${row.id}`}
                      className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
                    >
                      Start quote
                    </Link>
                    <form action={deleteQuoteTemplate}>
                      <input type="hidden" name="template_id" value={row.id} />
                      <SubmitButton
                        variant="outline"
                        size="sm"
                        pendingText="Deleting..."
                        confirm={`Delete template "${row.name}"? This cannot be undone.`}
                      >
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <form action={createQuoteTemplate} className="space-y-6">
        <SectionCard title="New Template" icon="plus">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Template Name" name="name" required placeholder="Domestic crew + positioning" />
            <TextField label="Description" name="description" placeholder="Short internal label for the picker" />
            <div className="md:col-span-2">
              <TextAreaField label="Default Client Notes" name="client_notes" />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Default Internal Notes" name="internal_notes" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Template Line Items" icon="receipt" description="These lines seed the quote when the template is applied.">
          <LineItemsEditor
            categories={[...QUOTE_CATEGORIES]}
            costTypes={[...BILLING_COST_TYPES]}
            showCostType
            defaultCategory="Crew Services"
          />
        </SectionCard>

        <div className="flex gap-3">
          <SubmitButton pendingText="Saving...">Save Template</SubmitButton>
        </div>
      </form>
    </>
  );
}
