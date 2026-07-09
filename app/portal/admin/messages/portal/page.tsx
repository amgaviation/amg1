import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { EmptyState, Notice, PageHeader, RecordRow, SectionCard } from "@/components/portal/ui/primitives";
import { MessageUnreadBadge } from "@/components/portal/ui/message-unread-badge";
import { Button } from "@/components/ui/button";
import { listThreadsForUser } from "@/lib/portal/queries";
import { formatDateTime } from "@/lib/portal/format";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";

export const metadata = { title: "Portal Messages - Admin Portal" };

export default async function AdminPortalMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRolePermission("admin", "messages");
  const params = await searchParams;
  const threads = await listThreadsForUser(user.id, true);
  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0);

  return (
    <>
      {params.error === "empty" ? <Notice tone="danger">Please enter a message.</Notice> : null}
      {params.error === "forbidden" ? (
        <Notice tone="danger">{getUserFacingErrorMessage({ audience: "admin", area: "communications", action: "message", category: "permission" })}</Notice>
      ) : null}
      {params.error === "payment-data" ? (
        <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before sending.</Notice>
      ) : null}
      {params.error && !["empty", "forbidden", "payment-data"].includes(params.error) ? (
        <Notice tone="danger">{getUserFacingErrorMessage({ audience: "admin", area: "communications", action: "message" })}</Notice>
      ) : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Portal Messages"
        description="In-app message threads started by clients, crew, and partners inside the portal. Replies here post back to their portal conversation."
        actions={
          <Button asChild variant="outline">
            <Link href="/portal/admin/messages">← Email Communications</Link>
          </Button>
        }
      />

      <Notice tone="info">
        This is the portal in-app inbox — separate from the email Communications hub. Threads here are how clients, crew, and
        partners reach AMG Operations from inside their portal. Every reply notifies the thread&apos;s members.
      </Notice>

      <SectionCard
        title="Message Threads"
        icon="messageSquare"
        description={`${threads.length} thread${threads.length === 1 ? "" : "s"}${totalUnread > 0 ? ` · ${totalUnread} unread` : ""}`}
      >
        {threads.length === 0 ? (
          <EmptyState
            icon="messageSquare"
            title="No portal messages yet"
            description="When a client, crew member, or partner starts a thread from their portal, it appears here for AMG Operations to answer."
          />
        ) : (
          <div className="space-y-3">
            {threads.map((t) => (
              <RecordRow
                key={t.id}
                href={`/portal/admin/messages/portal/${t.id}`}
                title={t.title ?? "AMG Operations"}
                tone={t.unread_count > 0 ? "gold" : "default"}
                meta={
                  <span className="flex flex-col gap-0.5">
                    {t.participant_label ? (
                      <span className="font-medium text-[var(--deck-text-2)]">{t.participant_label}</span>
                    ) : null}
                    {t.last_body ? <span className="line-clamp-1">{t.last_body}</span> : null}
                  </span>
                }
                trailing={
                  <>
                    <span className="deck-mono text-[var(--deck-text-3)]">{formatDateTime(t.last_message_at)}</span>
                    <MessageUnreadBadge count={t.unread_count} />
                  </>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
