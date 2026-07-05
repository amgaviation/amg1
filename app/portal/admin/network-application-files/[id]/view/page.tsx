import { notFound } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabase/server";
import { PortalDocumentViewer } from "@/components/portal/document-viewer";

export default async function NetworkApplicationFileViewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("admin");
  const { id } = await params;
  const db = (await createServiceClient()) as any;
  const { data: file } = await db.from("network_application_files").select("*").eq("id", id).maybeSingle();
  if (!file) notFound();

  return (
    <>
      <PortalDocumentViewer
        title={file.original_filename}
        description="Crew Network application document"
        contentHref={`/api/portal/network-application-files/${id}/content`}
        downloadHref={`/api/portal/network-application-files/${id}/content?download=1`}
        backHref={`/portal/admin/network-applications/${file.application_id}`}
        contentType={file.content_type}
      />
    </>
  );
}
