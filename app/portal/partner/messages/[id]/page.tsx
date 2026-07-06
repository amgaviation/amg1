import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { postMessage } from "@/app/portal/actions/messages";
import { isThreadMember } from "@/lib/portal/queries";
import { formatDateTime, initials } from "@/lib/portal/format";
import {
  getThreadWithMessagesForDisplay,
  messageSenderInitialsSource,
  messageSenderName,
} from "@/lib/portal/message-display";

export const metadata = { title: "Thread - Partner Portal" };

export default async function PartnerThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRolePermission("partner", "messages");
  const { id } = await params;
  if (!(await isThreadMember(id, user.id))) notFound();
  const result = await getThreadWithMessagesForDisplay(id);
  if (!result) notFound();

  return (
    <>
      <PageHeader eyebrow="Messages" title={result.thread.title ?? "AMG Operations"} actions={<Link href="/portal/partner/messages" className="text-xs text-muted-foreground hover:text-accent">Back to threads</Link>} />
      <SectionCard icon="messageSquare">
        <div className="space-y-4">
          {result.messages.map((message) => {
            const isMe = message.sender_id === user.id;
            const senderLabel = messageSenderName(message, user.id, user.role);
            return (
              <div key={message.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold">{initials(messageSenderInitialsSource(message))}</div>
                <div className={`max-w-[75%] rounded-md border px-4 py-3 ${isMe ? "border-accent/30 bg-accent/10" : "border-border bg-card"}`}>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">{senderLabel}</p>
                  <p className="text-sm leading-6">{message.body}</p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">{formatDateTime(message.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form action={postMessage} className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
          <input type="hidden" name="thread_id" value={result.thread.id} />
          <input type="hidden" name="back_to" value="/portal/partner/messages" />
          <textarea name="body" required placeholder="Type your message..." className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent" rows={3} />
          <div className="flex items-end max-sm:[&_button]:w-full max-sm:[&>*]:w-full"><SubmitButton className="rounded-full" pendingText="Sending...">Send</SubmitButton></div>
        </form>
      </SectionCard>
    </>
  );
}
