import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { isThreadMember } from "@/lib/portal/queries";
import { postMessage } from "@/app/portal/actions/messages";
import { formatDateTime, initials } from "@/lib/portal/format";
import {
  getThreadWithMessagesForDisplay,
  messageSenderInitialsSource,
  messageSenderName,
} from "@/lib/portal/message-display";

export const metadata = { title: "Thread — Client Portal" };

export default async function ClientThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("client");
  const { id } = await params;
  const member = await isThreadMember(id, user.id);
  if (!member) notFound();
  const result = await getThreadWithMessagesForDisplay(id);
  if (!result) notFound();
  const { thread, messages } = result;

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
                <div className={`max-w-[75%] rounded-xl px-4 py-3 ${isMe ? "bg-accent/10 border border-accent/30" : "bg-card border border-border"}`}>
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">{senderLabel}</p>
                  <p className="text-sm leading-6">{message.body}</p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">{formatDateTime(message.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form action={postMessage} className="mt-6 flex gap-3 border-t border-border pt-5">
          <input type="hidden" name="thread_id" value={thread.id} />
          <input type="hidden" name="back_to" value="/portal/client/messages" />
          <textarea name="body" required placeholder="Type your message…" className="deck-input flex-1" rows={3} />
          <div className="flex items-end">
            <SubmitButton className="rounded-full" pendingText="Sending…">Send</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
