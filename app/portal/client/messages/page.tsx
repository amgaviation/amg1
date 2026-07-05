import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard, EmptyState, Notice, RecordRow } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { TextAreaField, TextField } from "@/components/portal/ui/fields";
import { listThreadsForUser } from "@/lib/portal/queries";
import { startThread } from "@/app/portal/actions/messages";
import { formatDateTime } from "@/lib/portal/format";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";

export const metadata = { title: "Messages — Client Portal" };

export default async function ClientMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; error?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const threads = await listThreadsForUser(user.id, false);

  return (
    <>
      {params.error === "empty" ? <Notice tone="danger">Please enter a message.</Notice> : null}
      {params.error === "forbidden" ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "client", area: "communications", action: "message", category: "permission" })}</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before sending.</Notice> : null}
      {params.error && !["empty", "forbidden", "payment-data"].includes(params.error) ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "client", area: "communications", action: "message" })}</Notice> : null}

      <PageHeader eyebrow="Owner Services" title="Messages" description="Direct communication with AMG Operations." />
      <Notice tone="info">
        Portal messages may include operational updates, document requests, quotes, invoices, and support review information.
        Unless expressly stated by AMG in writing, a message does not indicate final acceptance of a support request. Do not
        send full card numbers, CVV codes, bank account numbers, or routing numbers.
      </Notice>

      <SectionCard title="Start a New Thread" icon="messageSquare">
        <form action={startThread}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Subject" name="title" required placeholder="TEB-PBI trip question, Document inquiry…" />
          </div>
          <div className="mt-4">
            <TextAreaField label="Message" name="body" required placeholder="Write your message to AMG Operations…" />
          </div>
          <div className="mt-4">
            <SubmitButton className="rounded-full" pendingText="Sending…">Send Message</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Message Threads" icon="messageSquare">
        {threads.length === 0 ? (
          <EmptyState icon="messageSquare" title="No messages yet" description="Start a thread above to contact AMG Operations." />
        ) : (
          <div className="space-y-3">
            {threads.map((t) => (
              <RecordRow
                key={t.id}
                href={`/portal/client/messages/${t.id}`}
                title={t.title ?? "AMG Operations"}
                meta={
                  t.last_body ? (
                    <span className="line-clamp-1">{t.last_body}</span>
                  ) : undefined
                }
                trailing={
                  <span className="deck-mono text-[var(--deck-text-3)]">
                    {formatDateTime(t.last_message_at)}
                  </span>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
