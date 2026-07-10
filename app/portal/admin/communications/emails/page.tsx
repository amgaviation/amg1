import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import {
  DetailRow,
  EmptyState,
  FilterTabs,
  Notice,
} from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { FormModal, RecordModal } from "@/components/portal/ui/record-modal";
import { DataTable } from "@/components/portal/ui/data-table";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { sendCommunicationEmailAction } from "@/app/portal/actions/communications";
import { listAllUsers } from "@/lib/portal/queries";
import {
  emailProviderStatus,
  listCommunicationRecordOptions,
  listCommunicationTemplates,
  listEmailCommunicationLogs,
} from "@/lib/portal/communications";
import { formatDateTime } from "@/lib/portal/format";
import { DeckSelect } from "@/components/portal/ui/fields";
import { Combobox } from "@/components/portal/ui/combobox";
import { RecipientPicker } from "@/components/portal/admin/recipient-picker";

export const metadata = { title: "Emails - Admin Portal" };

const CATEGORIES = [
  "General",
  "Operations",
  "Crew",
  "Client",
  "Support Request",
  "Quote",
  "Invoice",
  "Payment",
  "Partner",
  "Account",
  "Compliance",
  "Other",
];

const PAGE_SIZE = 25;

function tone(status: string) {
  if (status === "failed" || status === "bounced") return "danger" as const;
  if (status === "sent" || status === "delivered") return "success" as const;
  if (status === "queued") return "warn" as const;
  return "info" as const;
}

type Params = {
  success?: string;
  error?: string;
  q?: string;
  user?: string;
  date_from?: string;
  date_to?: string;
  time?: string;
  category?: string;
  template?: string;
  status?: string;
  sender?: string;
  page?: string;
  record?: string;
  compose?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = [
    "q",
    "user",
    "date_from",
    "date_to",
    "time",
    "category",
    "template",
    "status",
    "sender",
    "page",
  ];
  const search = new URLSearchParams();
  for (const key of keep) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) search.set(key, value);
    else search.delete(key);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "communications");
  const params = await searchParams;
  const [templates, records, users, logs] = await Promise.all([
    listCommunicationTemplates(),
    listCommunicationRecordOptions(),
    listAllUsers(),
    listEmailCommunicationLogs({
      q: params.q,
      user: params.user,
      dateFrom: params.date_from,
      dateTo: params.date_to,
      time: params.time,
      category: params.category,
      template: params.template,
      status: params.status,
      sender: params.sender,
    }),
  ]);
  const provider = emailProviderStatus();
  const basePath = "/portal/admin/communications/emails";

  // Selected record for the detail window. Filters usually contain it; a
  // deep link whose filters exclude the record falls back to one unfiltered
  // fetch so shared `?record=` URLs always resolve.
  let record: (typeof logs)[number] | null = params.record
    ? logs.find((log) => log.id === params.record) ?? null
    : null;
  if (params.record && !record) {
    const all = await listEmailCommunicationLogs({});
    record = all.find((log) => log.id === params.record) ?? null;
  }

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = logs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(
    params.q ||
      params.user ||
      params.date_from ||
      params.date_to ||
      params.category ||
      params.template ||
      params.status ||
      params.sender
  );

  const audienceGroups = [
    {
      label: "Clients",
      options: users
        .filter((row) => row.role === "client")
        .map((row) => ({
          email: row.email,
          label: row.company_name ?? row.full_name ?? row.email,
          description: row.full_name && row.company_name ? row.full_name : undefined,
        })),
    },
    {
      label: "Crew",
      options: users
        .filter((row) => row.role === "crew")
        .map((row) => ({
          email: row.email,
          label: row.full_name ?? row.email,
          description: row.company_name ?? undefined,
        })),
    },
    {
      label: "Vendors & Partners",
      options: users
        .filter((row) => row.role === "partner")
        .map((row) => ({
          email: row.email,
          label: row.company_name ?? row.full_name ?? row.email,
          description: row.full_name && row.company_name ? row.full_name : undefined,
        })),
    },
    {
      label: "AMG Team",
      options: users
        .filter((row) => row.role === "admin" || row.role === "super_admin")
        .map((row) => ({
          email: row.email,
          label: row.full_name ?? row.email,
        })),
    },
  ].map((group) => ({
    ...group,
    options: group.options.filter((option) => !option.email.includes("+released-")),
  }));

  const validationNotice =
    params.error === "validation" ? (
      <Notice tone="danger">
        Choose at least one valid recipient, a subject and body (or a template), and a
        related record or the general thread.
      </Notice>
    ) : params.error === "configuration" ? (
      <Notice tone="danger">Email provider is not configured.</Notice>
    ) : params.error === "failed" ? (
      <Notice tone="danger">Email could not be sent. Check the log for the failed entry.</Notice>
    ) : null;

  const composeHref = `${basePath}${listQuery(params, { compose: "1", page: undefined })}`;
  const composeOpen = params.compose === "1";
  const recordHref = (id: string) => `${basePath}${listQuery(params, { record: id })}`;

  return (
    <RecordListShell
      eyebrow="Communications"
      title="Emails"
      description="Every email AMG sends and receives — searchable, with sending in one place."
      actions={
        <Button asChild size="sm">
          <Link href={composeHref}>+ Compose Email</Link>
        </Button>
      }
      notices={
        <>
          {params.success === "sent" ? (
            <Notice tone="success">Email sent and logged.</Notice>
          ) : null}
          {!composeOpen ? validationNotice : null}
        </>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={params.status ?? ""}
          preserve={{
            q: params.q,
            category: params.category,
            template: params.template,
            sender: params.sender,
            date_from: params.date_from,
            date_to: params.date_to,
          }}
          options={[
            { value: "", label: "All" },
            { value: "sent", label: "Sent" },
            { value: "delivered", label: "Delivered" },
            { value: "queued", label: "Queued" },
            { value: "failed", label: "Failed" },
            { value: "bounced", label: "Bounced" },
            { value: "received", label: "Received" },
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Subject, recipient, body…"
            aria-label="Search email log"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="category"
            defaultValue={params.category ?? ""}
            aria-label="Category"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Categories" },
              ...CATEGORIES.map((category) => ({ value: category, label: category })),
            ]}
          />
          <DeckSelect
            name="template"
            defaultValue={params.template ?? ""}
            aria-label="Template"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Templates" },
              ...templates.map((template) => ({ value: template.id, label: template.name })),
            ]}
          />
          <DeckSelect
            name="sender"
            defaultValue={params.sender ?? ""}
            aria-label="Sender"
            className="w-auto min-w-[9rem]"
            options={[
              { value: "", label: "All Senders" },
              ...users
                .filter((row) => row.role === "admin" || row.role === "super_admin")
                .map((admin) => ({ value: admin.id, label: admin.full_name ?? admin.email })),
            ]}
          />
          <input
            name="date_from"
            type="date"
            defaultValue={params.date_from ?? ""}
            aria-label="From date"
            className="deck-input w-auto"
          />
          <input
            name="date_to"
            type="date"
            defaultValue={params.date_to ?? ""}
            aria-label="To date"
            className="deck-input w-auto"
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          {hasFilters ? (
            <Link
              href={basePath}
              className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Clear
            </Link>
          ) : null}
        </form>
      }
      count={`${logs.length} ${logs.length === 1 ? "entry" : "entries"}`}
      table={
        logs.length === 0 ? (
          <EmptyState
            icon="messageSquare"
            title="No email log entries"
            description={
              hasFilters
                ? "No emails match the current filters."
                : "Emails sent through the portal will appear here."
            }
          />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            getHref={(row) => recordHref(row.id)}
            emptyLabel="No email log entries."
            columns={[
              {
                header: "Sent",
                priority: "secondary",
                cell: (row) => (
                  <span className="deck-mono whitespace-nowrap text-[var(--deck-text-2)]">
                    {formatDateTime(row.sent_at ?? row.created_at)}
                  </span>
                ),
              },
              {
                header: "Subject",
                priority: "primary",
                cell: (row) => (
                  <div className="min-w-0 max-w-[26rem]">
                    <p className="truncate font-semibold text-[var(--deck-text)]">
                      {row.subject ?? "AMG Operations"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--deck-text-3)]">
                      {row.body_preview ?? row.failure_reason ?? "—"}
                    </p>
                  </div>
                ),
              },
              {
                header: "Recipient",
                cell: (row) => {
                  const extra = row.to_emails.length - 1;
                  return (
                    <div className="min-w-0 max-w-[16rem]">
                      <p className="truncate text-[var(--deck-text-2)]">
                        {row.recipient_name ?? row.to_emails[0] ?? "—"}
                      </p>
                      <p className="truncate text-xs text-[var(--deck-text-3)]">
                        {row.to_emails[0] ?? ""}
                        {extra > 0 ? ` +${extra} more` : ""}
                      </p>
                    </div>
                  );
                },
              },
              {
                header: "Category",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="whitespace-nowrap text-[var(--deck-text-2)]">
                    {row.email_category ?? "—"}
                  </span>
                ),
              },
              {
                header: "Status",
                cell: (row) => <StatusBadge label={row.status} tone={tone(row.status)} />,
              },
            ]}
          />
        )
      }
      pagination={{
        basePath,
        page: safePage,
        pageCount,
        params: {
          q: params.q,
          user: params.user,
          date_from: params.date_from,
          date_to: params.date_to,
          category: params.category,
          template: params.template,
          status: params.status,
          sender: params.sender,
        },
      }}
    >
      {record ? (
        <RecordModal
          eyebrow={record.direction === "inbound" ? "Received email" : "Sent email"}
          title={record.subject ?? "AMG Operations"}
          meta={`${formatDateTime(record.sent_at ?? record.created_at)}${
            record.sender_name ? ` · sent by ${record.sender_name}` : ""
          }`}
          badge={<StatusBadge label={record.status} tone={tone(record.status)} />}
          actions={
            <>
              {record.thread_id ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/portal/admin/messages?thread=${record.thread_id}`}>
                    Open thread
                  </Link>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline">
                <Link href={composeHref}>Compose new</Link>
              </Button>
            </>
          }
        >
          {record.failure_reason ? (
            <div className="mb-4">
              <Notice tone="danger">{record.failure_reason}</Notice>
            </div>
          ) : null}
          <dl>
            <DetailRow label="To">{record.to_emails.join(", ") || "—"}</DetailRow>
            {record.cc_emails.length ? (
              <DetailRow label="Cc">{record.cc_emails.join(", ")}</DetailRow>
            ) : null}
            {record.bcc_emails.length ? (
              <DetailRow label="Bcc">{record.bcc_emails.join(", ")}</DetailRow>
            ) : null}
            {record.from_email ? (
              <DetailRow label="From">
                {record.from_name ? `${record.from_name} · ` : ""}
                {record.from_email}
              </DetailRow>
            ) : null}
            <DetailRow label="Category">{record.email_category ?? "General"}</DetailRow>
            <DetailRow label="Template">{record.template_name ?? "Custom email"}</DetailRow>
            <DetailRow label="Provider">
              {record.provider ?? "resend"}
              {record.provider_message_id ? (
                <span className="deck-mono ml-2 text-xs text-[var(--deck-text-3)]">
                  {record.provider_message_id}
                </span>
              ) : null}
            </DetailRow>
            <DetailRow label="Timeline">
              <span className="grid gap-0.5 text-sm">
                <span>Created {formatDateTime(record.created_at)}</span>
                {record.sent_at ? <span>Sent {formatDateTime(record.sent_at)}</span> : null}
                {record.delivered_at ? (
                  <span>Delivered {formatDateTime(record.delivered_at)}</span>
                ) : null}
                {record.failed_at ? <span>Failed {formatDateTime(record.failed_at)}</span> : null}
                {record.received_at ? (
                  <span>Received {formatDateTime(record.received_at)}</span>
                ) : null}
              </span>
            </DetailRow>
          </dl>
          <div className="mt-5">
            <p className="deck-eyebrow mb-2">Message</p>
            <div className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-4 py-3 text-sm leading-6 text-[var(--deck-text-2)] whitespace-pre-wrap break-words">
              {record.body_text?.trim() || record.body_preview || "No message body stored."}
            </div>
          </div>
        </RecordModal>
      ) : null}

      {composeOpen ? (
        <FormModal
          eyebrow="Communications"
          title="Compose email"
          meta="Templated or custom — sent through the AMG operational wrapper and logged here."
          paramKeys={["compose"]}
          wide
        >
          {validationNotice ? <div className="mb-4">{validationNotice}</div> : null}
          {!provider.configured ? (
            <div className="mb-4">
              <Notice tone="warn">
                Email sending is disabled until the Resend provider is configured.
              </Notice>
            </div>
          ) : null}
          <form action={sendCommunicationEmailAction} className="grid gap-5">
            <input type="hidden" name="back_to" value={composeHref} />
            <input type="hidden" name="general_thread" value="on" />

            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Recipients
              <RecipientPicker name="to" groups={audienceGroups} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
                Template
                <DeckSelect
                  name="template_id"
                  aria-label="Template"
                  className="font-normal normal-case"
                  placeholder="Custom Email"
                  options={templates.map((template) => ({
                    value: template.id,
                    label: template.name,
                  }))}
                />
              </label>
              <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
                Category
                <DeckSelect
                  name="category"
                  defaultValue="General"
                  aria-label="Category"
                  className="font-normal normal-case"
                  options={CATEGORIES.map((category) => ({ value: category, label: category }))}
                />
              </label>
            </div>

            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Related Client
              <Combobox
                name="related_client_id"
                placeholder="General thread — or search a client…"
                options={records.clients.map((client) => ({
                  value: client.id,
                  label: client.label,
                }))}
                className="font-normal normal-case"
              />
            </label>

            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Subject
              <input
                name="subject"
                placeholder="Leave blank to use the selected template's subject"
                className="deck-input font-normal normal-case"
              />
            </label>

            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Body
              <textarea
                name="body"
                rows={8}
                placeholder="Leave blank to use the selected template's body. Custom content is rendered through the AMG operational email wrapper."
                className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 py-2 text-sm font-normal normal-case leading-6 text-[var(--deck-text)]"
              />
            </label>

            <div className="flex justify-end">
              <SubmitButton disabled={!provider.configured} pendingText="Sending...">
                Send Email
              </SubmitButton>
            </div>
          </form>
        </FormModal>
      ) : null}
    </RecordListShell>
  );
}
