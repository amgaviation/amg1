import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
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
    <PortalShell role="admin" user={user}>
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
            <SubmitButton className="rounded-full" pendingText="Creating...">Create & Send Invoice</SubmitButton>
          </form>
        </SectionCard>

        <SectionCard title="Standalone Invoice" icon="wallet">
          <form action={createStandaloneInvoice} className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Client" name="client_id" required defaultValue="" options={[{ value: "", label: "Select client..." }, ...clients.map((client) => ({ value: client.id, label: client.company_name ?? client.full_name ?? client.email }))]} />
            <SelectField label="Status" name="status" defaultValue="draft" options={INVOICE_STATUS.map((status) => ({ value: status.value, label: status.label }))} />
            <SelectField label="Mission" name="mission_id" defaultValue="" options={[{ value: "", label: "No mission" }, ...missions.map((mission) => ({ value: mission.id, label: mission.ref }))]} />
            <SelectField label="Aircraft" name="aircraft_id" defaultValue="" options={[{ value: "", label: "No aircraft" }, ...aircraft.map((item) => ({ value: item.id, label: item.tail_number }))]} />
            <SelectField label="Line Item Category" name="category" required defaultValue="Operational coordination" options={QUOTE_CATEGORIES.map((item) => ({ value: item, label: item }))} />
            <TextField label="Unit Price" name="unit_price" type="number" min="0" step="0.01" required />
            <TextField label="Quantity" name="quantity" type="number" min="0" step="0.01" defaultValue="1" />
            <TextField label="Due Date" name="due_date" type="date" />
            <div className="sm:col-span-2">
              <TextAreaField label="Description" name="description" />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField label="Client Notes" name="client_notes" />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton className="rounded-full" pendingText="Creating...">Create Invoice</SubmitButton>
            </div>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Invoice Register" icon="wallet">
        <DataTable
          rows={invoices}
          getKey={(row) => row.id}
          emptyLabel="No invoices created."
          columns={[
            { header: "Invoice", cell: (row) => <Link href={`/portal/admin/invoices/${row.id}`} className="font-mono text-xs text-accent hover:underline">{row.invoice_number}</Link> },
            { header: "Client", cell: (row) => row.client?.company_name ?? row.client?.full_name ?? row.client?.email ?? "-" },
            { header: "Mission", cell: (row) => row.mission?.ref ?? "-" },
            { header: "Quote", cell: (row) => row.quote?.ref ?? "-" },
            { header: "Due", cell: (row) => formatDate(row.due_date) },
            { header: "Total", cell: (row) => formatMoney(row.total), align: "right" },
            { header: "Due", cell: (row) => formatMoney(row.amount_due), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={INVOICE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(INVOICE_STATUS_TONE, row.status)} /> },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
