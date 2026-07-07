import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { EmptyState, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { MessageUnreadBadge } from "@/components/portal/ui/message-unread-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { TextAreaField, TextField } from "@/components/portal/ui/fields";
import { startThread } from "@/app/portal/actions/messages";
import { listThreadsForUser } from "@/lib/portal/queries";
import { formatDateTime } from "@/lib/portal/format";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";

export const metadata = { title: "Messages - Partner Portal" };

export default async function PartnerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRolePermission("partner", "messages");
  const params = await searchParams;
  const threads = await listThreadsForUser(user.id, false);
  return (
    <>
      {params.error === "empty" ? <Notice tone="danger">Please enter a message.</Notice> : null}
      {params.error === "forbidden" ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "vendor", area: "vendor_portal", action: "message", category: "permission" })}</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before sending.</Notice> : null}
      {params.error && !["empty", "forbidden", "payment-data"].includes(params.error) ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "vendor", area: "vendor_portal", action: "message" })}</Notice> : null}
      <PageHeader eyebrow="Service Partner" title="Messages" description="Coordinate service work with AMG Operations." />
      <Notice tone="info">Portal messages do not indicate final acceptance of a support request unless expressly stated by AMG in writing. Do not send full card numbers, CVV codes, bank account numbers, or routing numbers.</Notice>
      <SectionCard title="Start a New Thread" icon="messageSquare">
        <form action={startThread}>
          <div className="grid gap-4 sm:grid-cols-2"><TextField label="Subject" name="title" required placeholder="Service request update, quote question..." /></div>
          <div className="mt-4"><TextAreaField label="Message" name="body" required /></div>
          <div className="mt-4"><SubmitButton className="rounded-full" pendingText="Sending...">Send Message</SubmitButton></div>
        </form>
      </SectionCard>
      <SectionCard title="Message Threads" icon="messageSquare">
        {threads.length === 0 ? <EmptyState icon="messageSquare" title="No messages yet" description="Start a thread above to contact AMG Operations." /> : (
          <div className="space-y-2">{threads.map((thread) => (
            <Link key={thread.id} href={`/portal/partner/messages/${thread.id}`} className="block rounded-md border border-border bg-background/50 p-4 hover:border-accent/60">
              <div className="flex items-center justify-between gap-3"><p className="flex min-w-0 items-center gap-2 text-sm font-semibold"><span className="truncate">{thread.title ?? "AMG Operations"}</span><MessageUnreadBadge count={thread.unread_count} /></p><span className="text-xs text-muted-foreground">{formatDateTime(thread.last_message_at)}</span></div>
              {thread.last_body ? <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{thread.last_body}</p> : null}
            </Link>
          ))}</div>
        )}
      </SectionCard>
    </>
  );
}
