import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { postMessage } from "@/app/portal/actions/messages";
import { getThreadWithMessages, isThreadMember } from "@/lib/portal/queries";
import { formatDateTime, initials } from "@/lib/portal/format";

export const metadata = { title: "Thread - Partner Portal" };

export default async function PartnerThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("partner");
  const { id } = await params;
  if (!(await isThreadMember(id, user.id))) notFound();
  const result = await getThreadWithMessages(id);
  if (!result) notFound();

  return (
    <PortalShell role="partner" user={user}>
      <PageHeader eyebrow="Messages" title={result.thread.title ?? "AMG Operations"} actions={<Link href="/portal/partner/messages" className="text-xs text-muted-foreground hover:text-accent">Back to threads</Link>} />
      <SectionCard icon="messageSquare">
        <div className="space-y-4">
          {result.messages.map((message) => {
            const isMe = message.sender_id === user.id;
            return (
              <div key={message.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold">{initials(message.sender?.full_name ?? message.sender_email)}</div>
                <div className={`max-w-[75%] rounded-xl border px-4 py-3 ${isMe ? "border-accent/30 bg-accent/10" : "border-border bg-card"}`}>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">{isMe ? "You" : message.sender?.full_name ?? "AMG Operations"}</p>
                  <p className="text-sm leading-6">{message.body}</p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">{formatDateTime(message.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form action={postMessage} className="mt-6 flex gap-3 border-t border-border pt-5">
          <input type="hidden" name="thread_id" value={result.thread.id} />
          <input type="hidden" name="back_to" value="/portal/partner/messages" />
          <textarea name="body" required placeholder="Type your message..." className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent" rows={3} />
          <div className="flex items-end"><SubmitButton className="rounded-full" pendingText="Sending...">Send</SubmitButton></div>
        </form>
      </SectionCard>
    </PortalShell>
  );
}
