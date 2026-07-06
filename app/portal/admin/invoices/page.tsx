import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { TableSelectionScope } from "@/components/portal/ui/data-table-selection";
import { BulkResultNotice } from "@/components/portal/ui/bulk-result-notice";
import { bulkDeleteInvoices } from "@/app/portal/actions/bulk-records";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { ClientPickerField } from "@/components/portal/ui/combobox";
import { createInvoiceFromQuote, createStandaloneInvoice } from "@/app/portal/actions/invoices";
import { listAllAircraft, listAllInvoices, listAllMissions, listAllQuotes, listClients } from "@/lib/portal/queries";
import { INVOICE_STATUS, INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, QUOTE_CATEGORIES, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Invoices - Admin Portal" };

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [invoices, quotes, clients, missions, aircraft] = await Promise.all([
    listAllInvoices(),
    listAllQuotes(),
    listClients(),
    listAllMissions(),
    listAllAircraft(),
  ]);
  const acceptedQuotes = quotes.filter((quote) => ["approved", "accepted"].includes(quote.status));

  return (
    <>
      {params.success ? <Notice tone="success">Invoice updated.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Required invoice fields are missing.</Notice> : null}
      {params.error === "quote" ? <Notice tone="danger">Quote could not be found.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">Invoice could not be saved. Check billing database patch and required fields.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Invoices" description="Create, send, track, and reconcile client invoices." />

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Create From Accepted Quote" icon="receipt">
          <form action={createInvoiceFromQuote} className="grid gap-4">
            <SelectField
              label="Accepted Quote"
              name="quote_id"
              required
              defaultValue=""
              options={[
                { value: "", label: "Select accepted quote..." },
                ...acceptedQuotes.map((quote) => ({
                  value: quote.id,
                  label: `${quote.ref} - ${quote.client?.company_name ?? quote.client?.full_name ?? quote.client?.email ?? "Client"} - ${formatMoney(quote.total)}`,
                })),
              ]}
            />
            <TextField label="Due Date" name="due_date" type="date" />
            <TextAreaField label="Terms" name="terms" defaultValue="Due on receipt unless otherwise agreed in writing." />
            <div className="flex gap-3">
              <SubmitButton name="intent" value="draft" pendingText="Creating...">Create Draft</SubmitButton>
              <SubmitButton name="intent" value="send" pendingText="Sending...">Create & Send</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Standalone Invoice" icon="wallet">
          <form action={createStandaloneInvoice} className="grid gap-4 sm:grid-cols-2">
            <ClientPickerField clients={clients} required />
            <SelectField label="Status" name="status" defaultValue="draft" options={INVOICE_STATUS.map((status) => ({ value: status.value, label: status.label }))} />
            <SelectField label="Mission" name="mission_id" defaultValue="" options={[{ value: "", label: "No mission" }, ...missions.map((mission) => ({ value: mission.id, label: mission.ref }))]} />
            <SelectField label="Aircraft" name="aircraft_id" defaultValue="" options={[{ value: "", label: "No aircraft" }, ...aircraft.map((item) => ({ value: item.id, label: item.tail_number }))]} />
            <TextField label="Due Date" name="due_date" type="date" />
            <TextField label="Discount" name="discount_total" type="number" min="0" step="0.01" />
            <TextField label="Manual Tax" name="tax_total" type="number" min="0" step="0.01" defaultValue="0" />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-border p-3 sm:col-span-2 sm:grid-cols-[1.2fr_1.6fr_.7fr_.7fr_.7fr]">
                <SelectField label="Line Item Category" name="category[]" required={index === 0} defaultValue={index === 0 ? QUOTE_CATEGORIES[0] : ""} options={[{ value: "", label: "No line" }, ...QUOTE_CATEGORIES.map((item) => ({ value: item, label: item }))]} />
                <TextField label="Description" name="description[]" />
                <TextField label="Qty" name="quantity[]" type="number" min="0" step="0.01" defaultValue={index === 0 ? "1" : ""} />
                <TextField label="Unit Price" name="unit_price[]" type="number" min="0" step="0.01" />
                <TextField label="Unit" name="unit[]" placeholder="day, trip" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <TextAreaField label="Client Notes" name="client_notes" />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Creating...">Create Invoice</SubmitButton>
            </div>
          </form>
        </SectionCard>
      </div>

      <BulkResultNotice params={params} entityLabel="invoice" />
      <SectionCard title="Invoice Register" icon="wallet">
        <TableSelectionScope
          action={bulkDeleteInvoices}
          entity="invoice"
          backTo="/portal/admin/invoices"
          entityLabel="invoice"
          confirm="Delete the selected invoices? Only unsent drafts with no payments and no Stripe activity are deleted — every other invoice is skipped automatically (void or write off those instead)."
        >
        <DataTable
          selectable
          rows={invoices}
          getKey={(row) => row.id}
          getHref={(row) => `/portal/admin/invoices/${row.id}`}
          emptyLabel="No invoices created."
          columns={[
            { header: "Invoice", priority: "primary", cell: (row) => <span className="font-mono text-xs text-accent">{row.invoice_number}</span> },
            { header: "Client", cell: (row) => row.client?.company_name ?? row.client?.full_name ?? row.client?.email ?? "—" },
            { header: "Mission", cell: (row) => row.mission?.ref ?? "—" },
            { header: "Quote", cell: (row) => row.quote?.ref ?? "—" },
            { header: "Due Date", cell: (row) => formatDate(row.due_date) },
            { header: "Total", cell: (row) => formatMoney(row.total), align: "right" },
            { header: "Balance", cell: (row) => formatMoney(row.amount_due), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={INVOICE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(INVOICE_STATUS_TONE, row.status)} /> },
          ]}
        />
        </TableSelectionScope>
      </SectionCard>
    </>
  );
}
