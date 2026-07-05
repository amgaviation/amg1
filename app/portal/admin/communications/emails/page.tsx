import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { StatusBadge } from "@/components/portal/ui/status-badge";
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

const STATUSES = ["queued", "sent", "delivered", "failed", "bounced", "received"];

function tone(status: string) {
  if (status === "failed" || status === "bounced") return "danger" as const;
  if (status === "sent" || status === "delivered") return "success" as const;
  if (status === "queued") return "warn" as const;
  return "info" as const;
}

function optionLabel(user: { full_name: string | null; email: string; company_name: string | null; role: string }) {
  return `${user.company_name ?? user.full_name ?? user.email} - ${user.email}`;
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{
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
  }>;
}) {
  const user = await requireRole("admin");
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
  const clients = users.filter((row) => row.role === "client");
  const crew = users.filter((row) => row.role === "crew");
  const partners = users.filter((row) => row.role === "partner");
  const allPortalUsers = users.filter((row) => !row.email.includes("+released-"));

  return (
    <>
      {params.success === "sent" ? <Notice tone="success">Email sent and logged.</Notice> : null}
      {params.error === "validation" ? <Notice tone="danger">Choose at least one valid recipient, subject, body or template, and a related/general thread option.</Notice> : null}
      {params.error === "configuration" ? <Notice tone="danger">Email provider is not configured.</Notice> : null}
      {params.error === "failed" ? <Notice tone="danger">Email could not be sent. Check the log for the failed entry.</Notice> : null}

      <PageHeader
        eyebrow="Communications"
        title="Emails"
        description="Send templated or custom AMG emails and review searchable email communications."
      />

      <SectionCard title="Compose Email" icon="messageSquare">
        <form action={sendCommunicationEmailAction} className="grid gap-5">
          <input type="hidden" name="back_to" value="/portal/admin/communications/emails" />
          <input type="hidden" name="general_thread" value="on" />

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Template
              <DeckSelect name="template_id" aria-label="Template" className="font-normal normal-case" placeholder="Custom Email" options={templates.map((template) => ({ value: template.id, label: template.name }))} />
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Category
              <DeckSelect name="category" defaultValue="General" aria-label="Category" className="font-normal normal-case" options={CATEGORIES.map((category) => ({ value: category, label: category }))} />
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Related Client
              <Combobox name="related_client_id" placeholder="General thread — or search a client…" options={records.clients.map((client) => ({ value: client.id, label: client.label }))} className="font-normal normal-case" />
            </label>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Clients
              <select name="to" multiple className="min-h-36 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 py-2 text-sm font-normal normal-case text-[var(--deck-text)]">
                {clients.map((item) => (
                  <option key={item.id} value={item.email}>{optionLabel(item)}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Crew
              <select name="to" multiple className="min-h-36 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 py-2 text-sm font-normal normal-case text-[var(--deck-text)]">
                {crew.map((item) => (
                  <option key={item.id} value={item.email}>{optionLabel(item)}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              Vendors / Partners
              <select name="to" multiple className="min-h-36 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 py-2 text-sm font-normal normal-case text-[var(--deck-text)]">
                {partners.map((item) => (
                  <option key={item.id} value={item.email}>{optionLabel(item)}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
              All Users
              <select name="to" multiple className="min-h-36 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 py-2 text-sm font-normal normal-case text-[var(--deck-text)]">
                {allPortalUsers.map((item) => (
                  <option key={item.id} value={item.email}>{optionLabel(item)}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
            Manual Email
            <input name="to" type="text" placeholder="name@example.com, another@example.com" className="min-h-11 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 text-sm font-normal normal-case text-[var(--deck-text)]" />
          </label>

          <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
            Subject
            <input name="subject" placeholder="Leave blank to use selected template subject" className="min-h-11 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 text-sm font-normal normal-case text-[var(--deck-text)]" />
          </label>

          <label className="grid gap-2 text-xs font-semibold uppercase [letter-spacing:0.1em] text-[var(--deck-text-3)]">
            Body
            <textarea name="body" rows={8} placeholder="Leave blank to use selected template body. Custom content is rendered through the AMG operational email wrapper." className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 py-2 text-sm font-normal normal-case leading-6 text-[var(--deck-text)]" />
          </label>

          {!provider.configured ? (
            <Notice tone="warn">Email sending is disabled until the Resend provider is configured.</Notice>
          ) : null}

          <div className="flex justify-end">
            <SubmitButton disabled={!provider.configured} pendingText="Sending...">
              Send Email
            </SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Email Log" icon="history">
        <form className="grid gap-3 border-b border-[var(--deck-line)] pb-4 lg:grid-cols-4">
          <input name="q" defaultValue={params.q ?? ""} placeholder="Search subject, user, status, provider" className="min-h-11 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 text-sm text-[var(--deck-text)]" />
          <input name="user" defaultValue={params.user ?? ""} placeholder="User or recipient email" className="min-h-11 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 text-sm text-[var(--deck-text)]" />
          <input name="date_from" type="date" defaultValue={params.date_from ?? ""} className="min-h-11 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 text-sm text-[var(--deck-text)]" />
          <input name="date_to" type="date" defaultValue={params.date_to ?? ""} className="min-h-11 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 text-sm text-[var(--deck-text)]" />
          <input name="time" type="time" defaultValue={params.time ?? ""} className="min-h-11 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-3 text-sm text-[var(--deck-text)]" />
          <DeckSelect name="category" defaultValue={params.category ?? ""} aria-label="Category filter" options={[{ value: "", label: "All categories" }, ...CATEGORIES.map((category) => ({ value: category, label: category }))]} />
          <DeckSelect name="template" defaultValue={params.template ?? ""} aria-label="Template filter" options={[{ value: "", label: "All templates" }, ...templates.map((template) => ({ value: template.id, label: template.name }))]} />
          <DeckSelect name="status" defaultValue={params.status ?? ""} aria-label="Status filter" options={[{ value: "", label: "All statuses" }, ...STATUSES.map((status) => ({ value: status, label: status }))]} />
          <DeckSelect name="sender" defaultValue={params.sender ?? ""} aria-label="Sender filter" options={[{ value: "", label: "All senders" }, ...users.filter((row) => row.role === "admin").map((admin) => ({ value: admin.id, label: admin.full_name ?? admin.email }))]} />
          <div className="flex gap-2 lg:col-span-3">
            <SubmitButton variant="outline" pendingText="Filtering...">
              Filter Log
            </SubmitButton>
            <Link href="/portal/admin/communications/emails" className="inline-flex min-h-10 items-center rounded-md border border-[var(--deck-line)] px-4 text-sm font-semibold text-[var(--deck-text-2)] hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-accent-ink)]">
              Clear
            </Link>
          </div>
        </form>

        {logs.length ? (
          <div className="mt-4 overflow-hidden rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse text-sm">
                <thead className="bg-[var(--deck-panel-2)] text-left text-[0.66rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--deck-text-3)]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Sender</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-[var(--deck-line)] bg-[var(--deck-panel)]">
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--deck-text-2)]">{formatDateTime(log.sent_at ?? log.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--deck-text)]">{log.subject ?? "AMG Operations"}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--deck-text-3)]">{log.body_preview ?? log.failure_reason ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--deck-text-2)]">
                        <p>{log.recipient_name ?? log.to_emails[0] ?? "-"}</p>
                        <p className="text-xs text-[var(--deck-text-3)]">{log.to_emails.join(", ")}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--deck-text-2)]">{log.email_category ?? "-"}</td>
                      <td className="px-4 py-3 text-[var(--deck-text-2)]">{log.template_name ?? "Custom Email"}</td>
                      <td className="px-4 py-3 text-[var(--deck-text-2)]">{log.sender_name ?? "-"}</td>
                      <td className="px-4 py-3 text-[var(--deck-text-2)]">{log.provider ?? "resend"}</td>
                      <td className="px-4 py-3"><StatusBadge label={log.status} tone={tone(log.status)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] px-4 py-8 text-center text-sm text-[var(--deck-text-3)]">
            No email log entries match the current filters.
          </div>
        )}
      </SectionCard>
    </>
  );
}
