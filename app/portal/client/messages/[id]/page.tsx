import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { isThreadMember, markThreadRead } from "@/lib/portal/queries";
import { postMessage } from "@/app/portal/actions/messages";
import { formatDateTime, initials } from "@/lib/portal/format";
import {
  getThreadWithMessagesForDisplay,
  messageSenderInitialsSource,
  messageSenderName,
} from "@/lib/portal/message-display";

export const metadata = { title: "Thread — Client Portal" };

export default async function ClientThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRolePermission("client", "messages");
  const { id } = await params;
  const member = await isThreadMember(id, user.id);
  if (!member) notFound();
  const result = await getThreadWithMessagesForDisplay(id);
  if (!result) notFound();
  const { thread, messages } = result;

  // Mark the thread read for this member (fire-and-forget on server side)
  await markThreadRead(id, user.id).catch(() => null);

  return (
    <>
      <PageHeader eyebrow="Messages" title={thread.title ?? "AMG Operations"} actions={<Link href="/portal/client/messages" className="text-xs text-muted-foreground hover:text-accent">← All threads</Link>} />
      <SectionCard icon="messageSquare">
        <div className="space-y-4">
          {messages.map((message) => {
            const isMe = message.sender_id === user.id;
            const senderLabel = messageSenderName(message, user.id, user.role);
            return (
              <div key={message.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold">
                  {initials(messageSenderInitialsSource(message))}
                </div>
                <div className={`max-w-[75%] rounded-md px-4 py-3 ${isMe ? "bg-accent/10 border border-accent/30" : "bg-card border border-border"}`}>
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">{senderLabel}</p>
                  <p className="text-sm leading-6">{message.body}</p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">{formatDateTime(message.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form action={postMessage} className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
          <input type="hidden" name="thread_id" value={thread.id} />
          <input type="hidden" name="back_to" value="/portal/client/messages" />
          <textarea name="body" required placeholder="Type your message…" className="deck-input flex-1" rows={3} />
          <div className="flex items-end max-sm:[&_button]:w-full max-sm:[&>*]:w-full">
            <SubmitButton pendingText="Sending…">Send</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
