import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { createServiceClient } from "@/lib/supabase/server";
import { PortalDocumentViewer } from "@/components/portal/document-viewer";

export default async function CommunicationAttachmentViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRolePermission("admin", "communications");
  const { id } = await params;
  const db = (await createServiceClient()) as any;
  const { data: attachment } = await db
    .from("communication_attachments")
    .select("id, thread_id, file_name, content_type")
    .eq("id", id)
    .maybeSingle();
  if (!attachment) notFound();

  return (
    <>
      <PortalDocumentViewer
        title={attachment.file_name}
        description="Communication attachment"
        contentHref={`/api/communications/attachments/${id}/content`}
        downloadHref={`/api/communications/attachments/${id}`}
        backHref={`/portal/admin/messages/${attachment.thread_id}`}
        contentType={attachment.content_type}
      />
    </>
  );
}
