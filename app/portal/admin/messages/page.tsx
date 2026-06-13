import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { EmptyState, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { listThreadsForUser } from "@/lib/portal/queries";
import { formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Messages - Admin Portal" };

export default async function AdminMessagesPage() {
  const user = await requireRole("admin");
  const threads = await listThreadsForUser(user.id, true);

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader
        eyebrow="AMG Operations"
        title="Messages"
        description="Review and respond to message threads sent to AMG by clients, crew, and service partners."
      />

      <SectionCard title="Message Threads" icon="messageSquare">
        {threads.length === 0 ? (
          <EmptyState
            icon="messageSquare"
            title="No messages yet"
            description="New client, crew, and partner messages will appear here."
          />
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/portal/admin/messages/${thread.id}`}
                className="block rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-accent/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{thread.title ?? "AMG Operations"}</p>
                    {thread.last_body ? (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{thread.last_body}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(thread.last_message_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
