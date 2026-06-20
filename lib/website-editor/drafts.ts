import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { isWebsiteContentSlug, type WebsiteContentSlug } from "@/lib/website-editor/content";

export type WebsiteContentDraft = {
  id: string;
  page_slug: WebsiteContentSlug;
  content_json: unknown;
  status: "draft" | "ready_to_publish" | "published" | "archived" | "failed";
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
  base_git_sha: string | null;
  branch_name: string | null;
  pull_request_url: string | null;
  last_preview_url: string | null;
};

export type WebsitePublishEvent = {
  id: string;
  draft_id: string | null;
  page_slug: WebsiteContentSlug;
  action: string;
  actor_user_id: string | null;
  actor_email: string | null;
  github_branch: string | null;
  github_commit_sha: string | null;
  github_pr_url: string | null;
  vercel_preview_url: string | null;
  result: string | null;
  error_message: string | null;
  created_at: string;
};

function coerceDraft(row: any): WebsiteContentDraft | null {
  if (!row || !isWebsiteContentSlug(row.page_slug)) return null;
  return row as WebsiteContentDraft;
}

export async function listEditorDrafts(slug?: WebsiteContentSlug) {
  const db = await createServiceClient();
  let query = (db as any)
    .from("website_content_drafts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(24);
  if (slug) query = query.eq("page_slug", slug);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map(coerceDraft).filter(Boolean) as WebsiteContentDraft[];
}

export async function latestDraftForPage(slug: WebsiteContentSlug) {
  const drafts = await listEditorDrafts(slug);
  return drafts.find((draft) => draft.status !== "archived") ?? null;
}

export async function listEditorEvents(slug?: WebsiteContentSlug) {
  const db = await createServiceClient();
  let query = (db as any)
    .from("website_publish_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (slug) query = query.eq("page_slug", slug);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).filter((row: any) => isWebsiteContentSlug(row.page_slug)) as WebsitePublishEvent[];
}
