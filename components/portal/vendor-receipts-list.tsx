import Link from "next/link";
import { DataTable } from "@/components/portal/ui/data-table";
import { EmptyState, Notice } from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { FormModal } from "@/components/portal/ui/record-modal";
import { DeckSelect, Field, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { uploadVendorReceipt } from "@/app/portal/actions/vendor-invoices";
import { formatDate, formatMoney } from "@/lib/portal/format";
import {
  listMissionOptionsForContractor,
  listVendorInvoicesForSubmitter,
  listVendorReceiptsForUploader,
} from "@/lib/portal/vendor-invoices";
import type { SessionUser } from "@/lib/portal/session";

/**
 * Contractor Receipts tab (crew & partner). Everything they've uploaded —
 * standalone or attached to an invoice — with a modal uploader that can link
 * a mission and one of their open invoices.
 */

export type VendorReceiptsParams = {
  q?: string;
  page?: string;
  new?: string;
  success?: string;
  error?: string;
};

const PAGE_SIZE = 25;

export async function VendorReceiptsList({
  user,
  params,
}: {
  user: SessionUser;
  params: VendorReceiptsParams;
}) {
  const role = user.role as "crew" | "partner";
  const basePath = `/portal/${role}/receipts`;
  const [receipts, missions, invoices] = await Promise.all([
    listVendorReceiptsForUploader(user.id),
    listMissionOptionsForContractor(user.id, role),
    listVendorInvoicesForSubmitter(user.id),
  ]);

  const filtered = receipts.filter((receipt) => {
    if (!params.q) return true;
    const q = params.q.toLowerCase();
    return `${receipt.file_name} ${receipt.description ?? ""} ${receipt.mission?.ref ?? ""} ${receipt.invoice?.ref ?? ""}`
      .toLowerCase()
      .includes(q);
  });
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const uploadHref = `${basePath}?${params.q ? `q=${encodeURIComponent(params.q)}&` : ""}new=1`;

  return (
    <RecordListShell
      eyebrow={role === "crew" ? "Crew" : "Partner"}
      title="Receipts"
      description="Receipts you've uploaded — standalone or attached to an invoice. AMG sees them alongside your invoices."
      actions={
        <Button asChild size="sm">
          <Link href={uploadHref}>Upload Receipt</Link>
        </Button>
      }
      notices={
        <>
          {params.success === "uploaded" ? (
            <Notice tone="success">Receipt uploaded.</Notice>
          ) : null}
          {params.error === "receipt-file" ? (
            <Notice tone="danger">Receipts must be PDF or image files up to 25 MB.</Notice>
          ) : null}
          {params.error === "receipt-upload" || params.error === "save" ? (
            <Notice tone="danger">The receipt could not be saved. Try again.</Notice>
          ) : null}
          {params.error === "mission" ? (
            <Notice tone="danger">That mission is not linked to your account.</Notice>
          ) : null}
          {params.error === "invoice" ? (
            <Notice tone="danger">That invoice could not be found on your account.</Notice>
          ) : null}
        </>
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="File name, description, mission, invoice…"
            aria-label="Search receipts"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>
      }
      count={`${filtered.length} / ${receipts.length} receipts`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="fileText"
            title="No receipts yet"
            description="Upload receipts here, or attach them while submitting an invoice — both show up in this tab."
            action={
              <Button asChild size="sm">
                <Link href={uploadHref}>Upload Receipt</Link>
              </Button>
            }
          />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            columns={[
              {
                header: "File",
                priority: "primary",
                cell: (row) => (
                  <div className="min-w-0 max-w-[20rem]">
                    {/* Plain anchor on purpose: a row-level Link would let the
                        router prefetch the file API route. */}
                    <a
                      href={`/api/portal/vendor-receipts/${row.id}/content`}
                      target="_blank"
                      rel="noopener"
                      className="block truncate font-semibold text-[var(--deck-accent-ink)] hover:underline"
                    >
                      {row.file_name}
                    </a>
                    {row.description ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--deck-text-3)]">{row.description}</p>
                    ) : null}
                  </div>
                ),
              },
              {
                header: "Amount",
                align: "right",
                cell: (row) => (row.amount != null ? <span className="deck-num">{formatMoney(Number(row.amount))}</span> : "—"),
              },
              { header: "Mission", cell: (row) => row.mission?.ref ?? "—" },
              {
                header: "Invoice",
                cell: (row) =>
                  row.invoice ? (
                    <span className="deck-mono text-xs">{row.invoice.ref}</span>
                  ) : (
                    <span className="text-xs text-[var(--deck-text-3)]">Standalone</span>
                  ),
              },
              { header: "Uploaded", hideOnMobile: true, cell: (row) => formatDate(row.created_at) },
            ]}
          />
        )
      }
      pagination={{ basePath, page: safePage, pageCount, params: { q: params.q } }}
    >
      {params.new === "1" ? (
        <FormModal
          eyebrow={role === "crew" ? "Crew" : "Partner"}
          title="Upload receipt"
          meta="PDF or image files up to 25 MB. Optionally link a mission or one of your invoices."
          paramKeys={["new"]}
        >
          <form action={uploadVendorReceipt} className="grid gap-4">
            <input type="hidden" name="back_to" value={basePath} />
            <Field label="Receipt Files" required>
              <input
                type="file"
                name="receipts"
                multiple
                required
                accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
                className="block w-full cursor-pointer rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] p-4 text-sm text-[var(--deck-text-2)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--deck-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--deck-on-accent)]"
              />
            </Field>
            <TextField label="Description" name="description" placeholder="e.g. Fuel — KFXE, crew car" />
            <TextField label="Amount" name="amount" inputMode="decimal" placeholder="0.00" />
            <Field label="Related Mission">
              <DeckSelect
                name="mission_id"
                defaultValue=""
                aria-label="Related mission"
                options={[
                  { value: "", label: "Not linked to a mission" },
                  ...missions.map((mission) => ({ value: mission.id, label: mission.ref })),
                ]}
              />
            </Field>
            <Field label="Attach to Invoice">
              <DeckSelect
                name="invoice_id"
                defaultValue=""
                aria-label="Attach to invoice"
                options={[
                  { value: "", label: "Standalone receipt" },
                  ...invoices.map((invoice) => ({
                    value: invoice.id,
                    label: `${invoice.ref}${invoice.invoice_number ? ` (#${invoice.invoice_number})` : ""}`,
                  })),
                ]}
              />
            </Field>
            <div className="flex justify-end">
              <SubmitButton pendingText="Uploading...">Upload</SubmitButton>
            </div>
          </form>
        </FormModal>
      ) : null}
    </RecordListShell>
  );
}
