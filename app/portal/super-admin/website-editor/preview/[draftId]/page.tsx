import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHero } from "@/components/site/oc/shared";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/portal/session";
import { imageSrcForKey, isWebsiteEditorEnabled, validateWebsiteContent } from "@/lib/website-editor/content";

export const metadata = {
  title: "Draft Preview - Website Editor",
  robots: { index: false, follow: false },
};

export default async function WebsiteEditorPreviewPage({
  params,
}: {
  params: Promise<{ draftId: string }>;
}) {
  const user = await requireSuperAdmin();
  if (!isWebsiteEditorEnabled()) redirect("/access-denied");
  const { draftId } = await params;
  const db = await createServiceClient();
  const { data: draft } = await (db as any).from("website_content_drafts").select("*").eq("id", draftId).maybeSingle();
  const valid = validateWebsiteContent(draft?.content_json);
  if (!draft || !valid.ok) notFound();
  const content = valid.content;
  const hero = content.sections.hero ?? Object.values(content.sections)[0];

  return (
    <PortalShell role="super_admin" user={user}>
      <Notice tone="warn">Draft Preview - Not Live. This preview is restricted to Super Admin users.</Notice>
      <PageHeader
        eyebrow="Website Editor"
        title={`Preview: ${content.page}`}
        description="This uses draft content stored in Supabase and does not change production website content."
        actions={<Link href={`/portal/super-admin/website-editor?page=${content.page}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Return to Editor</Link>}
      />
      <SectionCard title="Rendered Public Hero" icon="fileText" bodyClassName="p-0 overflow-hidden">
        <div className="overflow-hidden rounded-b-lg">
          <PageHero
            eyebrow={hero.eyebrow ?? content.seo.title}
            title={hero.headline ?? content.seo.title}
            lead={hero.body ?? content.seo.description}
            image={imageSrcForKey(hero.imageKey) ?? "/images/amg-generated/backgrounds/operational-clarity-dispatch.jpg"}
            imageAlt=""
            primary={hero.primaryCtaLabel && hero.primaryCtaHref ? { label: hero.primaryCtaLabel, href: hero.primaryCtaHref } : undefined}
            secondary={hero.secondaryCtaLabel && hero.secondaryCtaHref ? { label: hero.secondaryCtaLabel, href: hero.secondaryCtaHref } : undefined}
          />
        </div>
      </SectionCard>
    </PortalShell>
  );
}
