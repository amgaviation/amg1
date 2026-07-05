import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";

export function PortalDocumentViewer({
  title,
  description,
  contentHref,
  downloadHref,
  backHref,
  contentType,
}: {
  title: string;
  description?: string;
  contentHref: string;
  downloadHref: string;
  backHref: string;
  contentType?: string | null;
}) {
  const isImage = Boolean(contentType?.startsWith("image/"));
  const isPdf = contentType === "application/pdf" || title.toLowerCase().endsWith(".pdf");
  const canPreview = isPdf || isImage;

  return (
    <>
      <PageHeader
        eyebrow="Secure File Viewer"
        title={title}
        description={description}
        actions={
          <>
            <Link href={backHref} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:border-[var(--deck-accent)]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <Link href={downloadHref} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              <Download className="h-3.5 w-3.5" />
              Download
            </Link>
          </>
        }
      />

      <SectionCard title="Preview" icon="fileText" className="min-h-[72vh]" bodyClassName="p-0">
        {canPreview ? (
          isImage ? (
            <div className="flex min-h-[68vh] items-center justify-center bg-[var(--deck-ink)] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={contentHref} alt={title} className="max-h-[76vh] max-w-full rounded-md object-contain shadow-[var(--deck-shadow-card)]" />
            </div>
          ) : (
            <iframe
              src={contentHref}
              title={title}
              className="h-[76vh] w-full rounded-b-md border-0 bg-[var(--deck-ink)]"
              sandbox="allow-same-origin allow-scripts allow-downloads"
            />
          )
        ) : (
          <div className="flex min-h-[64vh] flex-col items-center justify-center gap-4 bg-[var(--deck-panel-2)] p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)]">
              <FileText className="h-6 w-6 text-[var(--deck-accent-ink)]" />
            </div>
            <div>
              <h2 className="deck-title text-xl">Preview unavailable</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                This file type cannot be safely previewed inside the portal. Download it from this secure page.
              </p>
            </div>
            <Link href={downloadHref} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              <ExternalLink className="h-4 w-4" />
              Download File
            </Link>
          </div>
        )}
      </SectionCard>
    </>
  );
}
