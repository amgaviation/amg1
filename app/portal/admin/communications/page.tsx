import { requireRole } from "@/lib/portal/session";
import { permissionsForRole } from "@/lib/portal/permissions";
import { PageHeader, QuickLink, SectionCard } from "@/components/portal/ui/primitives";
import { createServiceClient } from "@/lib/supabase/server";
import { countUnread } from "@/lib/portal/queries";

export const metadata = { title: "Communications - AMG Operations" };

/**
 * Communications workspace landing: portal messages, the email center,
 * documents, and notifications in one place. (This route previously
 * redirected to the audit log; the audit log now lives under
 * Administration.)
 */
export default async function AdminCommunicationsPage() {
  const user = await requireRole("admin");
  const perms = await permissionsForRole(user.role);
  const db = await createServiceClient();

  const count = async (build: () => PromiseLike<{ count: number | null }>) => {
    try {
      const { count: value } = await build();
      return value ?? 0;
    } catch {
      return 0;
    }
  };

  const [unread, pendingDocuments, scheduledEmails] = await Promise.all([
    countUnread(user.id).catch(() => 0),
    perms.documents.view
      ? count(() => db.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review"))
      : 0,
    perms.communications.view
      ? count(() => (db as any).from("scheduled_emails").select("id", { count: "exact", head: true }).eq("status", "scheduled"))
      : 0,
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Communications"
        title="Communications"
        description="Portal message threads, the email center, shared documents, and your notification feed."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Conversations" icon="messageSquare" bodyClassName="grid gap-3">
          {perms.messages.view ? (
            <QuickLink
              href="/portal/admin/messages"
              icon="messageSquare"
              label="Messages"
              description={unread > 0 ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "Portal threads with clients, crew, and partners"}
            />
          ) : null}
          {perms.communications.view ? (
            <QuickLink
              href="/portal/admin/communications/emails"
              icon="mail"
              label="Email center"
              description={scheduledEmails > 0 ? `${scheduledEmails} email${scheduledEmails === 1 ? "" : "s"} scheduled` : "Templated and custom email sends"}
            />
          ) : null}
          {perms.notifications.view ? (
            <QuickLink href="/portal/admin/notifications" icon="bell" label="Notifications" description="Your in-app notification feed" />
          ) : null}
        </SectionCard>

        <SectionCard title="Documents" icon="fileText" bodyClassName="grid gap-3">
          {perms.documents.view ? (
            <QuickLink
              href="/portal/admin/documents"
              icon="fileText"
              label="Document center"
              description={
                pendingDocuments > 0
                  ? `${pendingDocuments} document${pendingDocuments === 1 ? "" : "s"} awaiting review`
                  : "Shared files across clients, crew, and partners"
              }
            />
          ) : null}
          {perms.documents.view ? (
            <QuickLink
              href="/portal/admin/documents?status=pending_review"
              icon="badgeCheck"
              label="Review queue"
              description="Documents waiting for an admin decision"
            />
          ) : null}
        </SectionCard>
      </div>
    </>
  );
}
