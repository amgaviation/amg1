import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
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
    <PortalShell role="admin" user={user}>
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
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Template
              <select name="template_id" className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-950">
                <option value="">Custom Email</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
              <select name="category" defaultValue="General" className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-950">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Related Client
              <select name="related_client_id" className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-950">
                <option value="">General thread</option>
                {records.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Clients
              <select name="to" multiple className="min-h-36 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-950">
                {clients.map((item) => (
                  <option key={item.id} value={item.email}>{optionLabel(item)}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Crew
              <select name="to" multiple className="min-h-36 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-950">
                {crew.map((item) => (
                  <option key={item.id} value={item.email}>{optionLabel(item)}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vendors / Partners
              <select name="to" multiple className="min-h-36 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-950">
                {partners.map((item) => (
                  <option key={item.id} value={item.email}>{optionLabel(item)}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              All Users
              <select name="to" multiple className="min-h-36 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-950">
                {allPortalUsers.map((item) => (
                  <option key={item.id} value={item.email}>{optionLabel(item)}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Manual Email
            <input name="to" type="text" placeholder="name@example.com, another@example.com" className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-950" />
          </label>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Subject
            <input name="subject" placeholder="Leave blank to use selected template subject" className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-950" />
          </label>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Body
            <textarea name="body" rows={8} placeholder="Leave blank to use selected template body. Custom content is rendered through the AMG operational email wrapper." className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case leading-6 tracking-normal text-slate-950" />
          </label>

          {!provider.configured ? (
            <Notice tone="warn">Email sending is disabled until the Resend provider is configured.</Notice>
          ) : null}

          <div className="flex justify-end">
            <SubmitButton disabled={!provider.configured} className="rounded-full" pendingText="Sending...">
              Send Email
            </SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Email Log" icon="history">
        <form className="grid gap-3 border-b border-slate-200 pb-4 lg:grid-cols-4">
          <input name="q" defaultValue={params.q ?? ""} placeholder="Search subject, user, status, provider" className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950" />
          <input name="user" defaultValue={params.user ?? ""} placeholder="User or recipient email" className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950" />
          <input name="date_from" type="date" defaultValue={params.date_from ?? ""} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950" />
          <input name="date_to" type="date" defaultValue={params.date_to ?? ""} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950" />
          <input name="time" type="time" defaultValue={params.time ?? ""} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950" />
          <select name="category" defaultValue={params.category ?? ""} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950">
            <option value="">All categories</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select name="template" defaultValue={params.template ?? ""} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950">
            <option value="">All templates</option>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
          <select name="status" defaultValue={params.status ?? ""} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950">
            <option value="">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select name="sender" defaultValue={params.sender ?? ""} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950">
            <option value="">All senders</option>
            {users.filter((row) => row.role === "admin").map((admin) => (
              <option key={admin.id} value={admin.id}>{admin.full_name ?? admin.email}</option>
            ))}
          </select>
          <div className="flex gap-2 lg:col-span-3">
            <SubmitButton variant="outline" className="rounded-full" pendingText="Filtering...">
              Filter Log
            </SubmitButton>
            <Link href="/portal/admin/communications/emails" className="inline-flex min-h-10 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:border-primary/40 hover:text-primary">
              Clear
            </Link>
          </div>
        </form>

        {logs.length ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse text-sm">
                <thead className="bg-slate-50 text-left text-[0.66rem] font-bold uppercase tracking-[0.16em] text-slate-500">
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
                    <tr key={log.id} className="border-t border-slate-100 bg-white">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(log.sent_at ?? log.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{log.subject ?? "AMG Operations"}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">{log.body_preview ?? log.failure_reason ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>{log.recipient_name ?? log.to_emails[0] ?? "-"}</p>
                        <p className="text-xs text-slate-500">{log.to_emails.join(", ")}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{log.email_category ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{log.template_name ?? "Custom Email"}</td>
                      <td className="px-4 py-3 text-slate-700">{log.sender_name ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{log.provider ?? "resend"}</td>
                      <td className="px-4 py-3"><StatusBadge label={log.status} tone={tone(log.status)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
            No email log entries match the current filters.
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
