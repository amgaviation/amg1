import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { EmptyState, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { TextAreaField, TextField } from "@/components/portal/ui/fields";
import { startThread } from "@/app/portal/actions/messages";
import { listThreadsForUser } from "@/lib/portal/queries";
import { formatDateTime } from "@/lib/portal/format";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";

export const metadata = { title: "Messages - Crew Portal" };

export default async function CrewMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole("crew");
  const params = await searchParams;
  const threads = await listThreadsForUser(user.id, false);

  return (
    <PortalShell role="crew" user={user}>
      {params.error === "empty" ? <Notice tone="danger">Please enter a message.</Notice> : null}
      {params.error === "forbidden" ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "crew", area: "communications", action: "message", category: "permission" })}</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before sending.</Notice> : null}
      {params.error && !["empty", "forbidden", "payment-data"].includes(params.error) ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "crew", area: "communications", action: "message" })}</Notice> : null}
      <PageHeader eyebrow="Flight Crew" title="Messages" description="Direct communication with AMG Operations." />
      <Notice tone="info">Portal messages do not indicate final acceptance of a support request unless expressly stated by AMG in writing. Do not send full card numbers, CVV codes, bank account numbers, or routing numbers.</Notice>
      <SectionCard title="Start a New Thread" icon="messageSquare">
        <form action={startThread}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Subject" name="title" required placeholder="Mission question, availability update..." />
          </div>
          <div className="mt-4"><TextAreaField label="Message" name="body" required /></div>
          <div className="mt-4"><SubmitButton className="rounded-full" pendingText="Sending...">Send Message</SubmitButton></div>
        </form>
      </SectionCard>
      <SectionCard title="Message Threads" icon="messageSquare">
        {threads.length === 0 ? <EmptyState icon="messageSquare" title="No messages yet" description="Start a thread above to contact AMG Operations." /> : (
          <div className="space-y-2">{threads.map((thread) => (
            <Link key={thread.id} href={`/portal/crew/messages/${thread.id}`} className="block rounded-lg border border-border bg-background/50 p-4 hover:border-accent/60">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{thread.title ?? "AMG Operations"}</p><span className="text-xs text-muted-foreground">{formatDateTime(thread.last_message_at)}</span></div>
              {thread.last_body ? <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{thread.last_body}</p> : null}
            </Link>
          ))}</div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
