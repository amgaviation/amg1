import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader, SectionCard, Notice, DetailRow, EmptyState } from "@/components/portal/ui/primitives";
import { TextAreaField, TextField, SelectField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { requireSuperAdmin } from "@/lib/portal/session";
import type { Tone } from "@/lib/portal/constants";
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
import { listEditorDrafts, latestDraftForPage, listEditorEvents, type WebsiteContentDraft, type WebsitePublishEvent } from "@/lib/website-editor/drafts";
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
    "preview-missing": { tone: "danger", body: "Preview is unavailable because the selected draft could not be found." },
    "publish-missing": { tone: "danger", body: "Create PR is unavailable because the selected draft could not be found." },
    "merge-missing": { tone: "danger", body: "Merge is unavailable until the draft has a valid pull request." },
    "archive-missing": { tone: "danger", body: "Archive is unavailable because the selected draft could not be found." },
    "rollback-missing": { tone: "danger", body: "Rollback is unavailable because the published draft could not be validated." },
  };
  return status ? messages[status] : null;
}

function readableStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function draftWorkflowStatus(draft: WebsiteContentDraft | null): { label: string; tone: Tone; help: string } {
  if (!draft) {
    return { label: "No draft", tone: "neutral", help: "Save a draft before preview, PR creation, or rollback actions." };
  }
  if (draft.status === "failed") {
    return { label: "Publish failed", tone: "danger", help: "Review publish history, fix the draft, then save again before retrying." };
  }
  if (draft.status === "published") {
    return { label: "Merge completed", tone: "success", help: "This draft has been merged. Save a new draft before creating another PR." };
  }
  if (draft.pull_request_url) {
    return { label: "PR open", tone: "warn", help: "Review GitHub and Vercel checks before merging to main." };
  }
  if (draft.last_preview_url) {
    return { label: "Preview available", tone: "info", help: "Preview the saved draft, then create a GitHub PR when ready." };
  }
  return { label: "Draft saved", tone: "info", help: "Draft saved. Preview is generated after a successful save." };
}

function validExternalUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
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
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-white/14 bg-[#050B14]/74 px-3 py-2 text-sm text-white">
              <input type="checkbox" name={`section.${key}.enabled`} value="true" defaultChecked={section.enabled} className="h-4 w-4 accent-[var(--deck-gold)]" />
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
              <p className="break-all text-xs text-[var(--amg-text-muted)] lg:col-span-2">Selected image resolves to {imageSrcForKey(section.imageKey)}</p>
            ) : null}
          </div>
        </SectionCard>
      ))}
      <TextAreaField label="Draft Notes" name="notes" defaultValue={latestDraft?.notes ?? ""} />
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#050B14]/92 p-3 shadow-[0_18px_58px_rgba(0,0,0,0.32)] backdrop-blur">
        <SubmitButton className="rounded-full" pendingText="Saving draft...">Save Draft</SubmitButton>
        {latestDraft ? <p className="text-xs text-[var(--amg-text-muted)]">Preview and publish actions are available in the Status panel.</p> : null}
        <p className="basis-full text-xs leading-5 text-[var(--amg-text-muted)]">
          CTA URLs must start with / or use an approved HTTPS AMG domain. Image selection is limited to approved image references.
        </p>
      </div>
    </form>
  );
}

function DraftActions({ draft, publishingConfigured }: { draft: WebsiteContentDraft | null; publishingConfigured: boolean }) {
  const workflow = draftWorkflowStatus(draft);
  if (!draft) {
    return (
      <div className="space-y-4">
        <StatusBadge label={workflow.label} tone={workflow.tone} />
        <p className="text-sm leading-6 text-[var(--amg-text-muted)]">{workflow.help}</p>
        <EmptyState title="No saved draft yet" description="Save a draft before previewing, publishing, or creating rollback versions." />
      </div>
    );
  }
  const prUrl = validExternalUrl(draft.pull_request_url);
  const previewUrl = draft.last_preview_url;
  const canCreatePr = publishingConfigured && draft.status !== "published" && draft.status !== "archived";
  const canMerge = publishingConfigured && Boolean(prUrl) && draft.status === "ready_to_publish";
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-[#050B14]/60 p-3">
        <StatusBadge label={workflow.label} tone={workflow.tone} />
        <p className="mt-2 text-xs leading-5 text-[var(--amg-text-muted)]">{workflow.help}</p>
      </div>
      <DetailRow label="Draft ID"><span className="font-mono text-xs">{draft.id}</span></DetailRow>
      <DetailRow label="Status">{readableStatus(draft.status)}</DetailRow>
      <DetailRow label="Updated">{new Date(draft.updated_at).toLocaleString()}</DetailRow>
      {draft.branch_name ? <DetailRow label="Branch"><span className="font-mono text-xs">{draft.branch_name}</span></DetailRow> : null}
      {prUrl ? <DetailRow label="Pull Request"><a href={prUrl} className="text-[var(--deck-gold-deep)] hover:underline" target="_blank" rel="noreferrer">View PR</a></DetailRow> : null}
      {previewUrl ? <DetailRow label="Preview"><Link href={previewUrl} className="text-[var(--deck-gold-deep)] hover:underline">Open Preview</Link></DetailRow> : null}
      <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
        Publishing updates the public website after GitHub and Vercel checks complete.
      </p>
      <div className="flex flex-wrap gap-2 pt-2">
        <form action={previewWebsiteContentDraft}>
          <input type="hidden" name="page_slug" value={draft.page_slug} />
          <input type="hidden" name="draft_id" value={draft.id} />
          <SubmitButton variant="outline" className="rounded-full" pendingText="Opening..." disabled={!previewUrl}>
            Preview Draft
          </SubmitButton>
        </form>
        <form action={publishWebsiteContentDraft}>
          <input type="hidden" name="page_slug" value={draft.page_slug} />
          <input type="hidden" name="draft_id" value={draft.id} />
          <SubmitButton
            className="rounded-full"
            pendingText="Creating PR..."
            disabled={!canCreatePr}
            confirm="Create a GitHub pull request for this saved draft?"
          >
            Create PR
          </SubmitButton>
        </form>
        <form action={mergeWebsiteContentDraft}>
          <input type="hidden" name="page_slug" value={draft.page_slug} />
          <input type="hidden" name="draft_id" value={draft.id} />
          <SubmitButton
            variant="outline"
            className="rounded-full"
            pendingText="Checking PR..."
            disabled={!canMerge}
            confirm="Merge this Website Editor pull request to main?"
          >
            Merge PR
          </SubmitButton>
        </form>
        <form action={archiveWebsiteContentDraft}>
          <input type="hidden" name="page_slug" value={draft.page_slug} />
          <input type="hidden" name="draft_id" value={draft.id} />
          <SubmitButton
            variant="outline"
            className="rounded-full"
            pendingText="Archiving..."
            confirm="Archive this draft? You can create a new draft later."
            disabled={draft.status === "archived"}
          >
            Archive
          </SubmitButton>
        </form>
      </div>
      {!publishingConfigured ? (
        <p className="text-xs leading-5 text-amber-100">GitHub publishing is not configured, so PR and merge actions are disabled.</p>
      ) : null}
    </div>
  );
}

function DraftHistory({
  drafts,
  events,
}: {
  drafts: WebsiteContentDraft[];
  events: WebsitePublishEvent[];
}) {
  const latestPublished = drafts.find((draft) => draft.status === "published") ?? null;
  const draftRows = drafts.slice(0, 6);

  return (
    <div className="space-y-4">
      {draftRows.length ? (
        <div className="space-y-2">
          {draftRows.map((draft) => {
            const workflow = draftWorkflowStatus(draft);
            return (
              <article key={draft.id} className="rounded-lg border border-white/10 bg-[#050B14]/60 p-3 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{readableStatus(draft.status)}</p>
                    <p className="mt-1 text-[var(--amg-text-muted)]">{new Date(draft.updated_at).toLocaleString()}</p>
                  </div>
                  <StatusBadge label={workflow.label} tone={workflow.tone} />
                </div>
                {draft.last_preview_url ? (
                  <Link href={draft.last_preview_url} className="mt-2 inline-flex text-[var(--deck-gold-deep)] hover:underline">
                    View preview
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="history"
          title="No preview history"
          description="Save a draft to create a preview and start the publish history for this page."
        />
      )}

      {latestPublished ? (
        <form action={createRollbackDraft}>
          <input type="hidden" name="page_slug" value={latestPublished.page_slug} />
          <input type="hidden" name="draft_id" value={latestPublished.id} />
          <SubmitButton
            variant="outline"
            className="w-full rounded-full"
            pendingText="Creating rollback..."
            confirm="Create a rollback draft from the latest published version?"
          >
            Create Rollback Draft
          </SubmitButton>
        </form>
      ) : null}

      <div className="space-y-2 border-t border-white/10 pt-4">
        <h3 className="text-[0.66rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--amg-text-muted)]">
          Publish Events
        </h3>
        {events.length ? events.map((event) => {
          const prUrl = validExternalUrl(event.github_pr_url);
          return (
            <article key={event.id} className="rounded-lg border border-white/10 bg-[#050B14]/60 p-3 text-xs">
              <p className="font-semibold text-white">{readableStatus(event.action)}</p>
              <p className="mt-1 text-[var(--amg-text-muted)]">{new Date(event.created_at).toLocaleString()} · {event.result ?? "Recorded"}</p>
              {prUrl ? <a href={prUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[var(--deck-gold-deep)] hover:underline">View PR</a> : null}
              {event.error_message ? <p className="mt-2 rounded-md border border-red-400/25 bg-red-400/10 px-2 py-1 text-red-100">{event.error_message}</p> : null}
            </article>
          );
        }) : (
          <p className="text-sm text-[var(--amg-text-muted)]">No publish events for this page yet.</p>
        )}
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
  const publishingConfigured = githubPublishingConfigured();

  return (
    <>
      {flash ? <Notice tone={flash.tone}>{flash.body}</Notice> : null}
      {!publishingConfigured ? (
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
                href={`/portal/super-admin/website-editor?page=${page.slug}${params.panel === "history" ? "&panel=history" : ""}`}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${page.slug === selectedSlug ? "bg-primary text-white" : "text-[var(--amg-text-muted)] hover:bg-white/[0.06] hover:text-white"}`}
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
            <DraftActions draft={latestDraft} publishingConfigured={publishingConfigured} />
          </SectionCard>
          <SectionCard
            title={params.panel === "history" ? "Preview History" : "Preview & Publish History"}
            icon="history"
            description="Draft previews, publish attempts, PR references, and rollback creation."
          >
            <DraftHistory drafts={drafts} events={events} />
          </SectionCard>
        </div>
      </div>
    </>
  );
}
