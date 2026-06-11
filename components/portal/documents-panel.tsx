import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type PortalSession } from "@/lib/portal-session";
import { uploadDocument } from "@/app/portal/document-actions";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

type Props = { session: PortalSession };

export async function DocumentsPanel({ session }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let documents: {
    id: string;
    name: string;
    doc_type: string;
    scope_type: string;
    visibility: string;
    created_at: string;
    storage_path: string;
  }[] = [];

  if (user) {
    const { data } = await supabase
      .from("documents")
      .select("id, name, doc_type, scope_type, visibility, created_at, storage_path")
      .order("created_at", { ascending: false });
    documents = data ?? [];
  }

  const backHref = `/portal/${session.role}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm">
            Your role-scoped document library.
          </p>
        </div>

        {/* Upload form */}
        <form action={uploadDocument} className="space-y-4 border border-border rounded-lg p-6" encType="multipart/form-data">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Upload Document
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="doc_name">
                Document Name
              </label>
              <input
                id="doc_name"
                name="doc_name"
                required
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Insurance Certificate"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="doc_type">
                Type
              </label>
              <select
                id="doc_type"
                name="doc_type"
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="insurance">Insurance</option>
                <option value="certificate">Certificate</option>
                <option value="manifest">Manifest</option>
                <option value="invoice">Invoice</option>
                <option value="permit">Permit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="visibility">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="owner">Owner only</option>
                <option value="crew">Crew</option>
                <option value="partner">Partner</option>
                <option value="admin">Admin only</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="file">
                File
              </label>
              <input
                id="file"
                name="file"
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary/10 file:text-primary file:text-xs"
              />
            </div>
          </div>
          <Button type="submit" size="sm">
            Upload
          </Button>
        </form>

        {/* Document list */}
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No documents yet. Upload your first above.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {doc.doc_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm capitalize text-muted-foreground">
                    {doc.scope_type}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {doc.visibility}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(doc.created_at))}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={`/api/portal/documents/${doc.id}/download`} method="GET">
                      <Button type="submit" variant="ghost" size="sm" className="gap-1 text-xs">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
