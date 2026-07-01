import { notFound } from "next/navigation";
import { requireUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";
import { createServiceClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PortalDocumentViewer } from "@/components/portal/document-viewer";

export default async function PortalDocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = (await createServiceClient()) as any;
  const { data: doc } = await db
    .from("documents")
    .select("id, name, original_file_name, mime_type, visibility, uploaded_by, scope_id, doc_type")
    .eq("id", id)
    .maybeSingle();
  if (!doc) notFound();

  const allowed = isAdminRole(user.role) || doc.visibility === "public" || doc.uploaded_by === user.id || doc.scope_id === user.id;
  if (!allowed) notFound();

  const backHref = isAdminRole(user.role) ? "/portal/admin/documents" : `/portal/${user.role}/documents`;
  return (
    <PortalShell role={isAdminRole(user.role) ? "admin" : user.role} user={user}>
      <PortalDocumentViewer
        title={doc.original_file_name ?? doc.name}
        description={doc.doc_type ?? "Portal document"}
        contentHref={`/api/portal/documents/${id}/content`}
        downloadHref={`/api/portal/documents/${id}/download`}
        backHref={backHref}
        contentType={doc.mime_type}
      />
    </PortalShell>
  );
}
