import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { EmptyState, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { formatDateTime } from "@/lib/portal/format";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";
import type { ErrorCategory } from "@/lib/errors/user-facing-errors";
import {
  addCommunicationInternalNoteAction,
  linkCommunicationThreadAction,
  sendCommunicationEmailAction,
  updateCommunicationThreadAction,
} from "@/app/portal/actions/communications";
import {
  emailProviderStatus,
  getCommunicationThreadDetail,
  listCommunicationRecordOptions,
  listCommunicationTemplates,
  listCommunicationThreads,
  type CommunicationMessage,
  type CommunicationRecordOptions,
  type CommunicationTemplate,
  type CommunicationThread,
  type ThreadSummary,
} from "@/lib/portal/communications";

export const metadata = { title: "Messages - Admin Portal" };

const VIEWS = [
  { value: "", label: "Need Attention" },
  { value: "unassigned", label: "Unassigned" },
  { value: "assigned", label: "Assigned to Me" },
  { value: "support", label: "Support Requests" },
  { value: "billing", label: "Quotes & Invoices" },
  { value: "failed", label: "Failed / Bounced" },
  { value: "archived", label: "Archived" },
];

const STATUS_OPTIONS = [
  "new",
  "needs_review",
  "action_required",
  "waiting_on_client",
  "waiting_on_crew",
  "waiting_on_owner_operator",
  "waiting_on_vendor",
  "waiting_on_billing",
  "resolved",
  "closed",
  "archived",
];

const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusTone(status: string) {
  if (status === "action_required" || status === "failed" || status === "bounced") return "danger" as const;
  if (status.startsWith("waiting")) return "warn" as const;
  if (status === "resolved" || status === "closed" || status === "delivered" || status === "sent") return "success" as const;
  if (status === "new" || status === "needs_review" || status === "received") return "info" as const;
  return "neutral" as const;
}

function priorityTone(priority: string) {
  if (priority === "urgent") return "danger" as const;
  if (priority === "high") return "warn" as const;
  if (priority === "low") return "neutral" as const;
  return "info" as const;
}

function ErrorNotice({ error, reference }: { error?: string; reference?: string }) {
  if (!error) return null;
  const category: ErrorCategory = error === "configuration" ? "configuration_missing" : error === "validation" ? "validation" : "send_failed";
  return (
    <Notice tone="danger">
      {getUserFacingErrorMessage({
        audience: "admin",
        area: "communications",
        action: "send",
        category,
        correlationId: reference,
      })}
    </Notice>
  );
}

function SuccessNotice({ success }: { success?: string }) {
  if (!success) return null;
  const copy: Record<string, string> = {
    sent: "Message sent and stored in the communication thread.",
    note: "Internal note added. It was not sent as an email.",
    updated: "Thread status and assignment updated.",
    linked: "Thread links updated.",
  };
  return <Notice tone="success">{copy[success] ?? "Communication action completed."}</Notice>;
}

function hrefWith(query: URLSearchParams, updates: Record<string, string | null>) {
  const next = new URLSearchParams(query);
  for (const [key, value] of Object.entries(updates)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return `/portal/admin/messages?${next.toString()}`;
}

function ThreadRow({ thread, selectedId, query }: { thread: ThreadSummary; selectedId?: string; query: URLSearchParams }) {
  const next = new URLSearchParams(query);
  next.set("thread", thread.id);
  next.delete("compose");

  return (
    <Link
      href={`/portal/admin/messages?${next.toString()}`}
      className={`block border-b border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50 ${
        selectedId === thread.id ? "bg-primary/5" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{thread.subject ?? "AMG Operations"}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{thread.sender_label ?? "AMG Operations"}</p>
        </div>
        <span className="shrink-0 text-[0.65rem] text-slate-500">{formatDateTime(thread.last_message_at ?? thread.created_at)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{thread.last_message_preview ?? "No message body stored yet."}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusBadge label={label(thread.status)} tone={statusTone(thread.status)} />
        <StatusBadge label={label(thread.priority)} tone={priorityTone(thread.priority)} />
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
          {thread.related_label}
        </span>
        {thread.unread_count > 0 ? (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {thread.unread_count} unread
          </span>
        ) : null}
        {thread.has_attachments ? <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600">Attachment</span> : null}
        {thread.failed_count > 0 ? <StatusBadge label="Failed" tone="danger" /> : null}
      </div>
    </Link>
  );
}

function Select({
  name,
  label: fieldLabel,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  options: { value?: string; id?: string; label: string }[];
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {fieldLabel}
      <select name={name} defaultValue={defaultValue ?? ""} className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900">
        <option value="">None</option>
        {options.map((option) => {
          const value = option.value ?? option.id ?? "";
          return (
          <option key={value} value={value}>
            {option.label}
          </option>
          );
        })}
      </select>
    </label>
  );
}

function TemplatePreview({ templates }: { templates: CommunicationTemplate[] }) {
  if (!templates.length) return null;
  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-600">
        Preview operational templates
      </summary>
      <div className="mt-3 grid gap-3">
        {templates.map((template) => (
          <div key={template.id} className="rounded-md border border-slate-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-950">{template.name}</p>
            <p className="mt-1 text-xs font-medium text-slate-600">{template.subject_template}</p>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{template.body_template_text}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

function ComposeForm({
  templates,
  records,
  providerConfigured,
  thread,
}: {
  templates: CommunicationTemplate[];
  records: CommunicationRecordOptions;
  providerConfigured: boolean;
  thread?: CommunicationThread | null;
}) {
  return (
    <form action={sendCommunicationEmailAction} className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="back_to" value={thread ? `/portal/admin/messages?thread=${thread.id}` : "/portal/admin/messages"} />
      {thread ? <input type="hidden" name="thread_id" value={thread.id} /> : null}
      {!thread ? (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="general_thread" className="h-4 w-4" />
          General thread without a related operational record
        </label>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          From
          <input value="AMG Operations" disabled className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-500" />
        </label>
        <Select
          name="template_id"
          label="Template"
          options={templates.map((template) => ({ value: template.id, label: template.name }))}
        />
      </div>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        To
        <input name="to" type="text" required placeholder="name@example.com, ops@example.com" className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cc
          <input name="cc" type="text" className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900" />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Bcc
          <input name="bcc" type="text" className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900" />
        </label>
      </div>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Subject
        <input name="subject" defaultValue={thread?.subject ?? ""} placeholder="Leave blank to use selected template subject" className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900" />
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Body
        <textarea name="body" rows={7} placeholder="Leave blank to use selected template body" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case leading-6 tracking-normal text-slate-900" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <Select name="related_client_id" label="Client" defaultValue={thread?.related_client_id} options={records.clients} />
        <Select name="related_aircraft_id" label="Aircraft" defaultValue={thread?.related_aircraft_id} options={records.aircraft} />
        <Select name="related_request_id" label="Support Request" defaultValue={thread?.related_request_id} options={records.requests} />
        <Select name="related_quote_id" label="Quote" defaultValue={thread?.related_quote_id} options={records.quotes} />
        <Select name="related_invoice_id" label="Invoice" defaultValue={thread?.related_invoice_id} options={records.invoices} />
      </div>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Attachments
        <input name="attachments" type="file" multiple className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-900" />
      </label>
      <TemplatePreview templates={templates} />
      {!providerConfigured ? (
        <Notice tone="warn">Email sending is disabled until a verified sender and email provider key are configured. Messages will not be marked sent without a real provider or the explicit local mock flag.</Notice>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton disabled={!providerConfigured} className="rounded-full" pendingText="Sending...">
          Send email
        </SubmitButton>
      </div>
    </form>
  );
}

function ThreadControls({ thread, records }: { thread: CommunicationThread; records: CommunicationRecordOptions }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form action={updateCommunicationThreadAction} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <input type="hidden" name="thread_id" value={thread.id} />
        <div className="grid gap-3 md:grid-cols-3">
          <Select name="status" label="Status" defaultValue={thread.status} options={STATUS_OPTIONS.map((value) => ({ value, label: label(value) }))} />
          <Select name="priority" label="Priority" defaultValue={thread.priority} options={PRIORITY_OPTIONS.map((value) => ({ value, label: label(value) }))} />
          <Select name="assigned_to_user_id" label="Assigned Admin" defaultValue={thread.assigned_to_user_id} options={records.admins} />
        </div>
        <div className="flex justify-end">
          <SubmitButton className="rounded-full" pendingText="Updating...">Update Thread</SubmitButton>
        </div>
      </form>
      <form action={linkCommunicationThreadAction} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <input type="hidden" name="thread_id" value={thread.id} />
        <div className="grid gap-3 md:grid-cols-2">
          <Select name="related_client_id" label="Client" defaultValue={thread.related_client_id} options={records.clients} />
          <Select name="related_aircraft_id" label="Aircraft" defaultValue={thread.related_aircraft_id} options={records.aircraft} />
          <Select name="related_request_id" label="Support Request" defaultValue={thread.related_request_id} options={records.requests} />
          <Select name="related_quote_id" label="Quote" defaultValue={thread.related_quote_id} options={records.quotes} />
          <Select name="related_invoice_id" label="Invoice" defaultValue={thread.related_invoice_id} options={records.invoices} />
        </div>
        <div className="flex justify-end">
          <SubmitButton className="rounded-full" pendingText="Linking...">Link Records</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: CommunicationMessage }) {
  const isNote = message.message_type === "internal_note";
  const isInbound = message.direction === "inbound";
  return (
    <article className={`rounded-lg border p-4 ${isNote ? "border-amber-500/30 bg-amber-50" : isInbound ? "border-slate-200 bg-white" : "border-primary/20 bg-primary/5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            {isNote ? "Internal Note" : message.from_name ?? message.from_email ?? "AMG Operations"}
          </p>
          <p className="text-xs text-slate-500">{formatDateTime(message.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge label={label(message.status)} tone={statusTone(message.status)} />
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600">
            {label(message.visibility)}
          </span>
        </div>
      </div>
      {message.subject ? <p className="mt-3 text-sm font-medium text-slate-800">{message.subject}</p> : null}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {message.body_text || "No text body was stored for this message."}
      </p>
      {message.failure_reason ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          Send failed. Review system logs or retry from this thread.
        </p>
      ) : null}
    </article>
  );
}

function ThreadDetail({
  detail,
  templates,
  records,
  providerConfigured,
}: {
  detail: Awaited<ReturnType<typeof getCommunicationThreadDetail>>;
  templates: CommunicationTemplate[];
  records: CommunicationRecordOptions;
  providerConfigured: boolean;
}) {
  if (!detail) {
    return (
      <div className="flex min-h-[34rem] items-center justify-center">
        <EmptyState icon="messageSquare" title="Select a thread" description="Choose a conversation from the inbox or start a new operational email." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-slate-500">{detail.thread.public_id}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{detail.thread.subject ?? "AMG Operations"}</h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge label={label(detail.thread.status)} tone={statusTone(detail.thread.status)} />
          <StatusBadge label={label(detail.thread.priority)} tone={priorityTone(detail.thread.priority)} />
        </div>
      </div>

      <ThreadControls thread={detail.thread} records={records} />

      <div className="grid gap-3">
        {detail.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {detail.attachments.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Attachments</p>
          <div className="mt-3 grid gap-2">
            {detail.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={`/api/communications/attachments/${attachment.id}`}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary hover:border-primary/40"
              >
                {attachment.file_name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={addCommunicationInternalNoteAction} className="grid gap-3 rounded-lg border border-amber-500/30 bg-amber-50 p-4">
          <input type="hidden" name="thread_id" value={detail.thread.id} />
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Internal Note
            <textarea name="body" required rows={4} className="rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-normal normal-case leading-6 tracking-normal text-slate-900" />
          </label>
          <div className="flex justify-end">
            <SubmitButton className="rounded-full" pendingText="Adding...">Add Internal Note</SubmitButton>
          </div>
        </form>
        <ComposeForm templates={templates} records={records} providerConfigured={providerConfigured} thread={detail.thread} />
      </div>
    </div>
  );
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string; view?: string; q?: string; status?: string; priority?: string; compose?: string; success?: string; error?: string; ref?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const provider = emailProviderStatus();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }

  const [threads, templates, records, detail] = await Promise.all([
    listCommunicationThreads(params),
    listCommunicationTemplates(),
    listCommunicationRecordOptions(),
    params.thread ? getCommunicationThreadDetail(params.thread) : Promise.resolve(null),
  ]);

  const activeView = params.view ?? "";
  const providerConfigured = provider.configured || provider.mockEnabled;

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader
        eyebrow="AMG Operations"
        title="Communications"
        description="Shared operational inbox for email threads, internal notes, record links, delivery status, and AMG support review communications."
      />

      <ErrorNotice error={params.error} reference={params.ref} />
      <SuccessNotice success={params.success} />

      <SectionCard
        className="overflow-hidden"
        bodyClassName="p-0"
      >
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold uppercase text-slate-950">Operational Inbox</h2>
                <StatusBadge label={providerConfigured ? "Sending enabled" : "Sending disabled"} tone={providerConfigured ? "success" : "warn"} />
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Email threads, internal notes, linked records, delivery status, and AMG support review communications.
              </p>
            </div>
            <Link
              href={hrefWith(query, { compose: "1", thread: null })}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.25)] hover:bg-blue-500"
            >
              Compose
            </Link>
          </div>

          <form className="mt-4 grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_11rem_11rem_auto]">
            <input type="hidden" name="view" value={activeView} />
            {params.thread ? <input type="hidden" name="thread" value={params.thread} /> : null}
            <input name="q" defaultValue={params.q ?? ""} placeholder="Search messages" className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm" />
            <select name="status" defaultValue={params.status ?? ""} className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </select>
            <select name="priority" defaultValue={params.priority ?? ""} className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
            </select>
            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary/40">
              Apply Filters
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
              {VIEWS.map((view) => {
                const next = new URLSearchParams(query);
                next.delete("thread");
                next.delete("compose");
                if (view.value) next.set("view", view.value);
                else next.delete("view");
                return (
                  <Link
                    key={view.value || "attention"}
                    href={`/portal/admin/messages?${next.toString()}`}
                    className={`shrink-0 rounded-full border px-3 py-2 text-sm ${activeView === view.value ? "border-primary/40 bg-primary/10 font-semibold text-slate-950" : "border-slate-200 bg-white text-slate-600 hover:border-primary/30"}`}
                  >
                    {view.label}
                  </Link>
                );
              })}
          </div>
        </div>

        <div className="grid min-h-[42rem] xl:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)]">
          <section className="border-b border-slate-200 xl:border-b-0 xl:border-r">
            <div className="border-b border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">{threads.length} thread{threads.length === 1 ? "" : "s"}</p>
              <p className="mt-1 text-xs text-slate-500">Unread, failed, and linked operational messages surface here.</p>
            </div>
            <div className="max-h-[42rem] overflow-y-auto">
              {threads.length ? (
                threads.map((thread) => <ThreadRow key={thread.id} thread={thread} selectedId={params.thread} query={query} />)
              ) : (
                <div className="p-6">
                  <EmptyState
                    icon="messageSquare"
                    title="No matching threads"
                    description="Adjust filters or compose a new operational email when outreach is needed."
                    action={
                      <Link href={hrefWith(query, { compose: "1", thread: null })} className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
                        Compose
                      </Link>
                    }
                  />
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0 p-5">
            {params.thread || detail ? (
              <ThreadDetail detail={detail} templates={templates} records={records} providerConfigured={providerConfigured} />
            ) : (
              <EmptyState
                icon="messageSquare"
                title="No thread selected"
                description="Select a conversation from the inbox to review the message history, update status, or link operational records."
                action={
                  <Link href={hrefWith(query, { compose: "1", thread: null })} className="inline-flex rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary">
                    Compose email
                  </Link>
                }
              />
            )}
          </section>
        </div>
      </SectionCard>

      {params.compose ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-label="Compose email">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">Admin Email</p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">Compose Operational Message</h3>
                <p className="mt-1 text-sm text-slate-500">Email sending is available to AMG admins when provider configuration is enabled.</p>
              </div>
              <Link href={hrefWith(query, { compose: null })} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close compose">
                X
              </Link>
            </header>
            <div className="max-h-[calc(92vh-6rem)] overflow-y-auto p-5">
              <ComposeForm templates={templates} records={records} providerConfigured={providerConfigured} />
            </div>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}
