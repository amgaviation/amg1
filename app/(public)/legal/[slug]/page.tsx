import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentPage } from "@/components/compliance/legal-document-page";
import { getLegalDocument, requiredLegalSlugs } from "@/lib/compliance/legal-pages";

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

  return {
    title: `AMG Aviation Group - ${document.title}`,
    description: document.description,
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
