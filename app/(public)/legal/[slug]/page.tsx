import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";
import { getLegalDocument, requiredLegalSlugs } from "@/lib/compliance/legal-pages";
import { SITE } from "@/lib/site-config";

const CANONICAL_BASE = process.env.NEXT_PUBLIC_APP_URL || SITE.url;

export function generateStaticParams() {
  return requiredLegalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) return {};

  // Several documents are also served at their own standalone route (e.g.
  // /mission-acceptance, /privacy-choices). Point the canonical at that
  // standalone route — the externally linked version — so search engines
  // consolidate the duplicates. Documents with no standalone route are
  // self-canonical under /legal/{slug}.
  const canonicalPath = document.legacyPath ?? `/legal/${slug}`;

  return {
    title: `AMG Aviation Group - ${document.title}`,
    description: document.description,
    alternates: { canonical: `${CANONICAL_BASE}${canonicalPath}` },
  };
}

export default async function LegalSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) notFound();
  return <LegalDocumentPage slug={slug} />;
}
