import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, EmptyState, Notice } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { TextAreaField, TextField } from "@/components/portal/ui/fields";
import { listThreadsForUser } from "@/lib/portal/queries";
import { startThread } from "@/app/portal/actions/messages";
import { formatDateTime } from "@/lib/portal/format";

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
    <PortalShell role="client" user={user}>
      {params.error === "empty" ? <Notice tone="danger">Please enter a message.</Notice> : null}

      <PageHeader eyebrow="Owner Services" title="Messages" description="Direct communication with AMG Operations." />

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
          <div className="space-y-2">
            {threads.map((t) => (
              <Link key={t.id} href={`/portal/client/messages/${t.id}`} className="flex flex-col gap-1 rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-accent/60">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-sm">{t.title ?? "AMG Operations"}</p>
                  <span className="text-xs text-muted-foreground">{formatDateTime(t.last_message_at)}</span>
                </div>
                {t.last_body ? <p className="text-xs text-muted-foreground line-clamp-1">{t.last_body}</p> : null}
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
