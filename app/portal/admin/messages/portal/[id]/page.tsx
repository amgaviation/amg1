import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { markThreadRead } from "@/lib/portal/queries";
import { postMessage } from "@/app/portal/actions/messages";
import { isAdminRole } from "@/lib/portal/constants";
import { formatDateTime, initials } from "@/lib/portal/format";
import {
  ADMIN_MESSAGE_ALIAS,
  getThreadWithMessagesForDisplay,
  messageSenderInitialsSource,
} from "@/lib/portal/message-display";

export const metadata = { title: "Portal Thread - Admin Portal" };

const BACK_TO = "/portal/admin/messages/portal";

export default async function AdminPortalThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRolePermission("admin", "messages");
  const { id } = await params;

  // Admins (and super_admins) may open any portal thread — no membership gate,
  // matching listThreadsForUser(user.id, true) which surfaces every thread.
  const result = await getThreadWithMessagesForDisplay(id);
  if (!result) notFound();
  const { thread, messages } = result;

  // Clear this admin's unread notifications for the thread they just opened.
  await markThreadRead(id, user.id).catch(() => null);

  return (
    <>
      <PageHeader
        eyebrow="Portal Messages"
        title={thread.title ?? "AMG Operations"}
        actions={
          <Link href={BACK_TO} className="text-xs text-[var(--deck-text-2)] hover:text-[var(--deck-accent-ink)]">
            ← All portal threads
          </Link>
        }
      />
      <SectionCard icon="messageSquare">
        <div className="space-y-4">
          {messages.map((message) => {
            // AMG-side (admin / super_admin) messages read as outbound and sit
            // on the right; the client / crew / partner sits on the left.
            const isOutbound = isAdminRole(message.sender?.role);
            const senderLabel = isOutbound
              ? ADMIN_MESSAGE_ALIAS
              : message.sender?.full_name ?? message.sender?.email ?? message.sender_email ?? "Unknown sender";
            return (
              <div key={message.id} className={`flex gap-3 ${isOutbound ? "flex-row-reverse" : ""}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--deck-line)] bg-[var(--deck-panel-2)] text-xs font-bold">
                  {initials(isOutbound ? ADMIN_MESSAGE_ALIAS : messageSenderInitialsSource(message))}
                </div>
                <div className={`max-w-[75%] rounded-md border px-4 py-3 ${isOutbound ? "border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)]" : "border-[var(--deck-line)] bg-[var(--deck-panel)]"}`}>
                  <p className="mb-1 text-xs font-semibold text-[var(--deck-text-2)]">{senderLabel}</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  <p className="mt-1 text-[0.65rem] text-[var(--deck-text-2)]">{formatDateTime(message.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form action={postMessage} className="mt-6 flex flex-col gap-3 border-t border-[var(--deck-line)] pt-5 sm:flex-row">
          <input type="hidden" name="thread_id" value={thread.id} />
          <input type="hidden" name="back_to" value={BACK_TO} />
          <textarea name="body" required placeholder="Reply to this portal thread as AMG Operations..." className="deck-input flex-1" rows={3} />
          <div className="flex items-end max-sm:[&_button]:w-full max-sm:[&>*]:w-full">
            <SubmitButton pendingText="Sending...">Send Reply</SubmitButton>
          </div>
        </form>
      </SectionCard>
    </>
  );
}
