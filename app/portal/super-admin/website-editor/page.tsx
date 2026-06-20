import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, Notice, DetailRow, EmptyState } from "@/components/portal/ui/primitives";
import { TextAreaField, TextField, SelectField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { requireSuperAdmin } from "@/lib/portal/session";
import {
  APPROVED_IMAGE_KEYS,
  WEBSITE_CONTENT_PAGES,
  getWebsiteContentPage,
  imageSrcForKey,
  isWebsiteContentSlug,
  isWebsiteEditorEnabled,
  validateWebsiteContent,
  type WebsiteContentPage,
  type WebsiteContentSlug,
} from "@/lib/website-editor/content";
import { githubPublishingConfigured } from "@/lib/website-editor/github";
import { listEditorDrafts, latestDraftForPage, listEditorEvents, type WebsiteContentDraft } from "@/lib/website-editor/drafts";
import {
  archiveWebsiteContentDraft,
  createRollbackDraft,
  mergeWebsiteContentDraft,
  previewWebsiteContentDraft,
  publishWebsiteContentDraft,
  saveWebsiteContentDraft,
} from "@/app/portal/super-admin/website-editor/actions";

export const metadata = {
  title: "Website Editor - Super Admin Portal",
  robots: { index: false, follow: false },
};

function statusMessage(status?: string) {
  const messages: Record<string, { tone: "success" | "danger" | "warn" | "info"; body: string }> = {
    "draft-saved": { tone: "success", body: "Draft saved. This has not changed the public website." },
    invalid: { tone: "danger", body: "Draft validation failed. Check required fields, URLs, and approved image references." },
    "save-failed": { tone: "danger", body: "Draft could not be saved." },
    "pr-created": { tone: "success", body: "GitHub pull request created for approved content files only." },
    "github-missing": { tone: "warn", body: "GitHub publishing is not configured. Add server-side GitHub environment variables before publishing." },
    "publish-failed": { tone: "danger", body: "Publish failed. Review the publish history for details." },
    merged: { tone: "success", body: "Pull request merged. Vercel will deploy the main branch according to project settings." },
    "merge-blocked": { tone: "danger", body: "Merge blocked. Checks may be pending/failing or the PR may not match Website Editor safety rules." },
    archived: { tone: "success", body: "Draft archived." },
    "rollback-created": { tone: "success", body: "Rollback draft created. Preview it and publish through the same PR workflow." },
    "rollback-failed": { tone: "danger", body: "Rollback draft could not be created." },
  };
  return status ? messages[status] : null;
}

function pageContentForEditing(live: WebsiteContentPage, draft: WebsiteContentDraft | null) {
  if (!draft) return live;
  const valid = validateWebsiteContent(draft.content_json);
  return valid.ok ? valid.content : live;
}

function EditorForm({ content, latestDraft }: { content: WebsiteContentPage; latestDraft: WebsiteContentDraft | null }) {
  return (
    <form action={saveWebsiteContentDraft} className="space-y-6">
      <input type="hidden" name="page_slug" value={content.page} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TextField label="SEO Title" name="seo.title" defaultValue={content.seo.title} maxLength={70} required />
        <TextField label="SEO Description" name="seo.description" defaultValue={content.seo.description} maxLength={170} required />
      </div>
      {Object.entries(content.sections).map(([key, section]) => (
        <SectionCard key={key} title={key.replace(/([A-Z])/g, " $1")} icon="fileText" description="Structured content fields only. Raw HTML and scripts are not allowed.">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <input type="checkbox" name={`section.${key}.enabled`} value="true" defaultChecked={section.enabled} className="h-4 w-4 accent-[var(--primary)]" />
              <span>Section enabled</span>
            </label>
            <SelectField
              label="Approved Image"
              name={`section.${key}.imageKey`}
              defaultValue={section.imageKey ?? ""}
              options={[{ value: "", label: "No image reference" }, ...Object.keys(APPROVED_IMAGE_KEYS).map((imageKey) => ({ value: imageKey, label: imageKey }))]}
            />
            <TextField label="Eyebrow" name={`section.${key}.eyebrow`} defaultValue={section.eyebrow ?? ""} />
            <TextField label="Headline" name={`section.${key}.headline`} defaultValue={section.headline ?? ""} required={section.enabled} />
            <TextAreaField label="Body" name={`section.${key}.body`} defaultValue={section.body ?? ""} className="lg:col-span-2" />
            <TextField label="Primary CTA Label" name={`section.${key}.primaryCtaLabel`} defaultValue={section.primaryCtaLabel ?? ""} />
            <TextField label="Primary CTA URL" name={`section.${key}.primaryCtaHref`} defaultValue={section.primaryCtaHref ?? ""} />
            <TextField label="Secondary CTA Label" name={`section.${key}.secondaryCtaLabel`} defaultValue={section.secondaryCtaLabel ?? ""} />
            <TextField label="Secondary CTA URL" name={`section.${key}.secondaryCtaHref`} defaultValue={section.secondaryCtaHref ?? ""} />
            {section.imageKey && imageSrcForKey(section.imageKey) ? (
              <p className="text-xs text-slate-500 lg:col-span-2">Selected image resolves to {imageSrcForKey(section.imageKey)}</p>
            ) : null}
          </div>
        </SectionCard>
      ))}
      <TextAreaField label="Draft Notes" name="notes" defaultValue={latestDraft?.notes ?? ""} />
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <SubmitButton className="rounded-full" pendingText="Saving draft...">Save Draft</SubmitButton>
        {latestDraft ? <p className="text-xs text-slate-500">Preview and publish actions are available in the Status panel.</p> : null}
      </div>
    </form>
  );
}

function DraftActions({ draft }: { draft: WebsiteContentDraft | null }) {
  if (!draft) return <EmptyState title="No saved draft yet" description="Save a draft before previewing, publishing, or creating rollback versions." />;
  return (
    <div className="space-y-3">
      <DetailRow label="Draft ID"><span className="font-mono text-xs">{draft.id}</span></DetailRow>
      <DetailRow label="Status">{draft.status}</DetailRow>
      <DetailRow label="Updated">{new Date(draft.updated_at).toLocaleString()}</DetailRow>
      {draft.branch_name ? <DetailRow label="Branch"><span className="font-mono text-xs">{draft.branch_name}</span></DetailRow> : null}
      {draft.pull_request_url ? <DetailRow label="Pull Request"><a href={draft.pull_request_url} className="text-primary hover:underline" target="_blank" rel="noreferrer">Open PR</a></DetailRow> : null}
      {draft.last_preview_url ? <DetailRow label="Preview"><a href={draft.last_preview_url} className="text-primary hover:underline" target="_blank" rel="noreferrer">Open Preview</a></DetailRow> : null}
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
        Preview the draft first. Creating a PR writes approved JSON content only; Merge PR publishes that PR into main for the next Vercel production deployment.
      </p>
      <div className="flex flex-wrap gap-2 pt-2">
        <form action={previewWebsiteContentDraft}>
          <input type="hidden" name="page_slug" value={draft.page_slug} />
          <input type="hidden" name="draft_id" value={draft.id} />
          <SubmitButton variant="outline" className="rounded-full" pendingText="Opening...">Preview Draft</SubmitButton>
        </form>
        <form action={publishWebsiteContentDraft}>
          <input type="hidden" name="page_slug" value={draft.page_slug} />
          <input type="hidden" name="draft_id" value={draft.id} />
          <SubmitButton className="rounded-full" pendingText="Creating PR...">Create PR</SubmitButton>
        </form>
        {draft.pull_request_url ? (
          <form action={mergeWebsiteContentDraft}>
            <input type="hidden" name="page_slug" value={draft.page_slug} />
            <input type="hidden" name="draft_id" value={draft.id} />
            <SubmitButton variant="outline" className="rounded-full" pendingText="Checking PR...">Merge PR to Main</SubmitButton>
          </form>
        ) : null}
        <form action={archiveWebsiteContentDraft}>
          <input type="hidden" name="page_slug" value={draft.page_slug} />
          <input type="hidden" name="draft_id" value={draft.id} />
          <SubmitButton variant="outline" className="rounded-full" pendingText="Archiving...">Archive</SubmitButton>
        </form>
      </div>
    </div>
  );
}

export default async function WebsiteEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; panel?: string }>;
}) {
  const user = await requireSuperAdmin();
  if (!isWebsiteEditorEnabled()) redirect("/access-denied");
  const params = await searchParams;
  const selectedSlug: WebsiteContentSlug = isWebsiteContentSlug(params.page) ? params.page : "home";
  const live = getWebsiteContentPage(selectedSlug);
  const [latestDraft, drafts, events] = await Promise.all([
    latestDraftForPage(selectedSlug),
    listEditorDrafts(selectedSlug),
    listEditorEvents(selectedSlug),
  ]);
  const selectedContent = pageContentForEditing(live, latestDraft);
  const flash = statusMessage(params.status);

  return (
    <PortalShell role="super_admin" user={user}>
      {flash ? <Notice tone={flash.tone}>{flash.body}</Notice> : null}
      {!githubPublishingConfigured() ? (
        <Notice tone="warn">Publishing is disabled until `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` are configured server-side.</Notice>
      ) : null}
      <PageHeader
        eyebrow="Super Admin"
        title="Website Editor"
        description="Edit public website content, save drafts, preview changes, and publish approved updates."
      />
      <Notice tone="warn">Publishing changes can update the live public website after GitHub and Vercel checks complete.</Notice>

      <div className="grid gap-6 xl:grid-cols-[16rem_1fr_22rem]">
        <SectionCard title="Pages" icon="clipboard" bodyClassName="p-3">
          <nav className="grid gap-1">
            {WEBSITE_CONTENT_PAGES.map((page) => (
              <Link
                key={page.slug}
                href={`/portal/super-admin/website-editor?page=${page.slug}`}
                className={`rounded-md px-3 py-2 text-sm ${page.slug === selectedSlug ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title={WEBSITE_CONTENT_PAGES.find((page) => page.slug === selectedSlug)?.label ?? selectedSlug} icon="fileText" description="Draft saves do not change production content. Public pages read committed JSON only.">
            <EditorForm content={selectedContent} latestDraft={latestDraft} />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Status & Actions" icon="shield">
            <DraftActions draft={latestDraft} />
          </SectionCard>
          <SectionCard title="Publish History" icon="history">
            <div className="space-y-3">
              {events.length ? events.map((event) => (
                <article key={event.id} className="rounded-md border border-slate-200 p-3 text-xs">
                  <p className="font-semibold text-slate-900">{event.action}</p>
                  <p className="mt-1 text-slate-500">{new Date(event.created_at).toLocaleString()} · {event.result}</p>
                  {event.github_pr_url ? <a href={event.github_pr_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-primary hover:underline">PR / commit reference</a> : null}
                  {event.error_message ? <p className="mt-1 text-red-700">{event.error_message}</p> : null}
                </article>
              )) : <p className="text-sm text-slate-500">No publish history for this page yet.</p>}
              {drafts.filter((draft) => draft.status === "published").map((draft) => (
                <form key={`rollback-${draft.id}`} action={createRollbackDraft}>
                  <input type="hidden" name="page_slug" value={draft.page_slug} />
                  <input type="hidden" name="draft_id" value={draft.id} />
                  <SubmitButton variant="outline" className="w-full rounded-full" pendingText="Creating rollback...">
                    Create Rollback Draft
                  </SubmitButton>
                </form>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
