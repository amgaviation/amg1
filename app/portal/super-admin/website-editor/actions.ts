"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/portal/session";
import {
  contentFromEditorForm,
  isWebsiteContentSlug,
  isWebsiteEditorEnabled,
  validateWebsiteContent,
  type WebsiteContentSlug,
} from "@/lib/website-editor/content";
import { createWebsiteContentPullRequest, mergeWebsiteEditorPullRequest } from "@/lib/website-editor/github";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";

function editorPath(slug: string, status: string) {
  return `/portal/super-admin/website-editor?page=${encodeURIComponent(slug)}&status=${encodeURIComponent(status)}`;
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error && /GitHub publishing is not configured|checks are pending|outside approved|valid Website Editor/.test(error.message)) {
    return error.message;
  }
  return "Website Editor action could not be completed.";
}

async function logEditorEvent(input: {
  draftId?: string | null;
  pageSlug: WebsiteContentSlug;
  action: string;
  actorUserId: string;
  actorEmail: string;
  githubBranch?: string | null;
  githubCommitSha?: string | null;
  githubPrUrl?: string | null;
  result: string;
  errorMessage?: string | null;
}) {
  const db = await createServiceClient();
  await (db as any).from("website_publish_events").insert({
    draft_id: input.draftId ?? null,
    page_slug: input.pageSlug,
    action: input.action,
    actor_user_id: input.actorUserId,
    actor_email: input.actorEmail,
    github_branch: input.githubBranch ?? null,
    github_commit_sha: input.githubCommitSha ?? null,
    github_pr_url: input.githubPrUrl ?? null,
    result: input.result,
    error_message: input.errorMessage ?? null,
  });
}

export async function saveWebsiteContentDraft(formData: FormData) {
  const user = await requireSuperAdmin();
  if (!isWebsiteEditorEnabled()) redirect("/access-denied");
  const parsed = contentFromEditorForm(formData);
  const slug = String(formData.get("page_slug") ?? "");
  if (!parsed.ok || !isWebsiteContentSlug(slug)) redirect(editorPath(slug || "home", "invalid"));

  const db = await createServiceClient();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const baseGitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  const { data: existing } = await (db as any)
    .from("website_content_drafts")
    .select("id")
    .eq("page_slug", slug)
    .in("status", ["draft", "ready_to_publish", "failed"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    page_slug: slug,
    content_json: parsed.content,
    status: "draft",
    updated_by: user.id,
    notes,
    base_git_sha: baseGitSha,
  };

  const result = existing?.id
    ? await (db as any).from("website_content_drafts").update(payload).eq("id", existing.id).select("id").single()
    : await (db as any)
        .from("website_content_drafts")
        .insert({ ...payload, created_by: user.id })
        .select("id")
        .single();

  if (result.error || !result.data?.id) redirect(editorPath(slug, "save-failed"));
  await logEditorEvent({
    draftId: result.data.id,
    pageSlug: slug,
    action: existing?.id ? "draft_saved" : "draft_created",
    actorUserId: user.id,
    actorEmail: user.email,
    result: "success",
  });
  await recordComplianceEvidence({
    actor: user,
    audience: "admin",
    eventType: "admin_access_review_completed",
    eventArea: "compliance",
    relatedRecordType: "website_content_draft",
    relatedRecordId: result.data.id,
    metadata: { pageSlug: slug, action: "website_content_draft_saved" },
  });
  revalidatePath("/portal/super-admin/website-editor");
  redirect(editorPath(slug, "draft-saved"));
}

export async function previewWebsiteContentDraft(formData: FormData) {
  const user = await requireSuperAdmin();
  if (!isWebsiteEditorEnabled()) redirect("/access-denied");
  const draftId = String(formData.get("draft_id") ?? "");
  const slug = String(formData.get("page_slug") ?? "home");
  if (!draftId || !isWebsiteContentSlug(slug)) redirect(editorPath(slug, "preview-missing"));
  await logEditorEvent({
    draftId,
    pageSlug: slug,
    action: "preview",
    actorUserId: user.id,
    actorEmail: user.email,
    result: "success",
  });
  redirect(`/portal/super-admin/website-editor/preview/${draftId}`);
}

export async function publishWebsiteContentDraft(formData: FormData) {
  const user = await requireSuperAdmin();
  if (!isWebsiteEditorEnabled()) redirect("/access-denied");
  const draftId = String(formData.get("draft_id") ?? "");
  const slug = String(formData.get("page_slug") ?? "");
  if (!draftId || !isWebsiteContentSlug(slug)) redirect(editorPath(slug || "home", "publish-missing"));
  const db = await createServiceClient();
  const { data: draft } = await (db as any).from("website_content_drafts").select("*").eq("id", draftId).eq("page_slug", slug).maybeSingle();
  const valid = validateWebsiteContent(draft?.content_json);
  if (!draft || !valid.ok) redirect(editorPath(slug, "invalid"));

  try {
    await logEditorEvent({ draftId, pageSlug: slug, action: "publish_attempted", actorUserId: user.id, actorEmail: user.email, result: "started" });
    const result = await createWebsiteContentPullRequest({ slug, content: valid.content, editorEmail: user.email, draftId });
    await (db as any).from("website_content_drafts").update({
      status: "ready_to_publish",
      branch_name: result.branch,
      pull_request_url: result.pullRequestUrl,
      updated_by: user.id,
    }).eq("id", draftId);
    await logEditorEvent({
      draftId,
      pageSlug: slug,
      action: "open_pull_request",
      actorUserId: user.id,
      actorEmail: user.email,
      githubBranch: result.branch,
      githubCommitSha: result.commitSha,
      githubPrUrl: result.pullRequestUrl,
      result: "success",
    });
  } catch (error) {
    const message = safeErrorMessage(error);
    await (db as any).from("website_content_drafts").update({ status: "failed", updated_by: user.id }).eq("id", draftId);
    await logEditorEvent({
      draftId,
      pageSlug: slug,
      action: "publish_failed",
      actorUserId: user.id,
      actorEmail: user.email,
      result: "failed",
      errorMessage: message,
    });
    redirect(editorPath(slug, message.includes("not configured") ? "github-missing" : "publish-failed"));
  }
  redirect(editorPath(slug, "pr-created"));
}

export async function mergeWebsiteContentDraft(formData: FormData) {
  const user = await requireSuperAdmin();
  if (!isWebsiteEditorEnabled()) redirect("/access-denied");
  const draftId = String(formData.get("draft_id") ?? "");
  const slug = String(formData.get("page_slug") ?? "");
  if (!draftId || !isWebsiteContentSlug(slug)) redirect(editorPath(slug || "home", "merge-missing"));
  const db = await createServiceClient();
  const { data: draft } = await (db as any).from("website_content_drafts").select("*").eq("id", draftId).eq("page_slug", slug).maybeSingle();
  if (!draft?.pull_request_url) redirect(editorPath(slug, "merge-missing"));

  try {
    await logEditorEvent({ draftId, pageSlug: slug, action: "merge_attempted", actorUserId: user.id, actorEmail: user.email, result: "started", githubPrUrl: draft.pull_request_url });
    const result = await mergeWebsiteEditorPullRequest(draft.pull_request_url);
    await (db as any).from("website_content_drafts").update({ status: "published", updated_by: user.id }).eq("id", draftId);
    await logEditorEvent({
      draftId,
      pageSlug: slug,
      action: "merge_completed",
      actorUserId: user.id,
      actorEmail: user.email,
      githubBranch: draft.branch_name,
      githubCommitSha: result.commitSha,
      githubPrUrl: result.pullRequestUrl,
      result: "success",
    });
  } catch (error) {
    await logEditorEvent({
      draftId,
      pageSlug: slug,
      action: "publish_failed",
      actorUserId: user.id,
      actorEmail: user.email,
      githubBranch: draft.branch_name,
      githubPrUrl: draft.pull_request_url,
      result: "failed",
      errorMessage: safeErrorMessage(error),
    });
    redirect(editorPath(slug, "merge-blocked"));
  }
  redirect(editorPath(slug, "merged"));
}

export async function archiveWebsiteContentDraft(formData: FormData) {
  const user = await requireSuperAdmin();
  if (!isWebsiteEditorEnabled()) redirect("/access-denied");
  const draftId = String(formData.get("draft_id") ?? "");
  const slug = String(formData.get("page_slug") ?? "");
  if (!draftId || !isWebsiteContentSlug(slug)) redirect(editorPath(slug || "home", "archive-missing"));
  const db = await createServiceClient();
  await (db as any).from("website_content_drafts").update({ status: "archived", updated_by: user.id }).eq("id", draftId);
  await logEditorEvent({ draftId, pageSlug: slug, action: "draft_archived", actorUserId: user.id, actorEmail: user.email, result: "success" });
  revalidatePath("/portal/super-admin/website-editor");
  redirect(editorPath(slug, "archived"));
}

export async function createRollbackDraft(formData: FormData) {
  const user = await requireSuperAdmin();
  if (!isWebsiteEditorEnabled()) redirect("/access-denied");
  const draftId = String(formData.get("draft_id") ?? "");
  const slug = String(formData.get("page_slug") ?? "");
  if (!draftId || !isWebsiteContentSlug(slug)) redirect(editorPath(slug || "home", "rollback-missing"));
  const db = await createServiceClient();
  const { data: source } = await (db as any)
    .from("website_content_drafts")
    .select("*")
    .eq("id", draftId)
    .eq("page_slug", slug)
    .maybeSingle();
  const valid = validateWebsiteContent(source?.content_json);
  if (!source || !valid.ok) redirect(editorPath(slug, "rollback-missing"));
  const { data: created, error } = await (db as any)
    .from("website_content_drafts")
    .insert({
      page_slug: slug,
      content_json: valid.content,
      status: "draft",
      created_by: user.id,
      updated_by: user.id,
      notes: `Rollback draft created from ${source.pull_request_url ?? source.id}`,
      base_git_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    })
    .select("id")
    .single();
  if (error || !created?.id) redirect(editorPath(slug, "rollback-failed"));
  await logEditorEvent({
    draftId: created.id,
    pageSlug: slug,
    action: "rollback_created",
    actorUserId: user.id,
    actorEmail: user.email,
    githubPrUrl: source.pull_request_url,
    result: "success",
  });
  revalidatePath("/portal/super-admin/website-editor");
  redirect(editorPath(slug, "rollback-created"));
}
