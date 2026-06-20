import "server-only";

import {
  approvedContentPathForSlug,
  assertApprovedContentPath,
  stringifyContent,
  type WebsiteContentPage,
  type WebsiteContentSlug,
} from "@/lib/website-editor/content";

type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  defaultBranch: string;
};

export type GitHubPublishResult = {
  branch: string;
  commitSha: string;
  pullRequestUrl: string;
  pullRequestNumber: number;
};

function githubConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const defaultBranch = process.env.GITHUB_DEFAULT_BRANCH || "main";
  if (!token || !owner || !repo) return null;
  return { token, owner, repo, defaultBranch };
}

export function githubPublishingConfigured() {
  return Boolean(githubConfig());
}

async function githubFetch<T>(config: GitHubConfig, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub request failed (${response.status}): ${detail.slice(0, 240)}`);
  }
  return response.json() as Promise<T>;
}

function timestampForBranch() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z").replace("T", "-");
}

function encodePath(filePath: string) {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

export async function createWebsiteContentPullRequest({
  slug,
  content,
  editorEmail,
  draftId,
}: {
  slug: WebsiteContentSlug;
  content: WebsiteContentPage;
  editorEmail: string;
  draftId: string;
}): Promise<GitHubPublishResult> {
  const config = githubConfig();
  if (!config) throw new Error("GitHub publishing is not configured.");

  const filePath = assertApprovedContentPath(approvedContentPathForSlug(slug));
  const branch = `content/${slug}-${timestampForBranch()}`;
  const refs = `/repos/${config.owner}/${config.repo}/git/ref/heads/${config.defaultBranch}`;
  const baseRef = await githubFetch<{ object: { sha: string } }>(config, refs);

  await githubFetch(config, `/repos/${config.owner}/${config.repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha: baseRef.object.sha,
    }),
  });

  const existing = await githubFetch<{ sha: string }>(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(branch)}`,
  );

  const commit = await githubFetch<{ commit: { sha: string } }>(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodePath(filePath)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: `Update website content: ${slug}`,
        content: Buffer.from(stringifyContent(content), "utf8").toString("base64"),
        sha: existing.sha,
        branch,
      }),
    },
  );

  const now = new Date().toISOString();
  const pr = await githubFetch<{ html_url: string; number: number }>(
    config,
    `/repos/${config.owner}/${config.repo}/pulls`,
    {
      method: "POST",
      body: JSON.stringify({
        title: `Website content update: ${slug}`,
        head: branch,
        base: config.defaultBranch,
        body: [
          "Website content update generated from the AMG Aviation Group portal.",
          "",
          `Page: ${slug}`,
          `Editor: ${editorEmail}`,
          `Draft ID: ${draftId}`,
          `Timestamp: ${now}`,
          "",
          "This PR updates structured website content only. No layout or component code should be changed by this editor workflow.",
        ].join("\n"),
      }),
    },
  );

  return { branch, commitSha: commit.commit.sha, pullRequestUrl: pr.html_url, pullRequestNumber: pr.number };
}

async function checksPass(config: GitHubConfig, ref: string) {
  const status = await githubFetch<{ state: string; statuses: unknown[] }>(
    config,
    `/repos/${config.owner}/${config.repo}/commits/${encodeURIComponent(ref)}/status`,
  );
  const checks = await githubFetch<{ total_count: number; check_runs: Array<{ conclusion: string | null; status: string }> }>(
    config,
    `/repos/${config.owner}/${config.repo}/commits/${encodeURIComponent(ref)}/check-runs`,
  );
  const hasStatuses = status.statuses.length > 0;
  const hasChecks = checks.total_count > 0;
  if (!hasStatuses && !hasChecks) return true;
  return status.state === "success" && checks.check_runs.every((run) => run.status === "completed" && run.conclusion === "success");
}

export async function mergeWebsiteEditorPullRequest(prUrl: string) {
  const config = githubConfig();
  if (!config) throw new Error("GitHub publishing is not configured.");
  const match = prUrl.match(/\/pull\/(\d+)(?:$|[?#])/);
  const number = match ? Number(match[1]) : null;
  if (!number) throw new Error("Draft does not have a valid Website Editor pull request.");

  const pr = await githubFetch<{ head: { sha: string; ref: string }; html_url: string; merged: boolean }>(
    config,
    `/repos/${config.owner}/${config.repo}/pulls/${number}`,
  );
  if (pr.merged) return { merged: true, commitSha: pr.head.sha, pullRequestUrl: pr.html_url };

  const files = await githubFetch<Array<{ filename: string }>>(
    config,
    `/repos/${config.owner}/${config.repo}/pulls/${number}/files?per_page=100`,
  );
  if (!files.length || files.some((file) => {
    try {
      assertApprovedContentPath(file.filename);
      return false;
    } catch {
      return true;
    }
  })) {
    throw new Error("Merge blocked because the pull request modifies files outside approved content/site paths.");
  }

  if (!(await checksPass(config, pr.head.sha))) {
    throw new Error("Merge blocked because GitHub checks are pending or failing.");
  }

  const merged = await githubFetch<{ merged: boolean; sha: string }>(
    config,
    `/repos/${config.owner}/${config.repo}/pulls/${number}/merge`,
    {
      method: "PUT",
      body: JSON.stringify({
        merge_method: "squash",
        commit_title: `Website content update: PR #${number}`,
      }),
    },
  );

  if (!merged.merged) throw new Error("GitHub did not merge the pull request.");
  return { merged: true, commitSha: merged.sha, pullRequestUrl: pr.html_url };
}
