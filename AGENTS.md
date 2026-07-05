# Codex Instructions for AMG1

- Treat GitHub repository `amgaviation/amg1` as the source of truth for this project.
- For AMG Aviation Group business model, website, portal, pricing, compliance, launch,
  copy, or strategy work, check `docs/amg-aviation-group-reference.md` before acting.
  If a request conflicts with that reference, challenge it with the relevant document point
  before implementing.
- Codex Cloud task/repository selectors are authoritative in ephemeral workspaces; local remotes or branch names may differ.
- Do not rely on Tony's local MacBook files, paths, caches, credentials, or uncommitted local state.
- Use a new branch or the normal Codex pull request workflow for each task.
- Use npm for dependency installation and scripts because `package-lock.json` is present.
- When practical before completion, run:
  - `npm install`
  - `npm run lint`
  - `npm run build`
- Do not commit secrets, `.env` files, `.vercel`, `node_modules`, `.next`, build output, cache folders, or temporary folders.
- Preserve existing website features, routes, components, public assets, Supabase files, authentication behavior, database logic, public copy, layout, animations, and portal behavior unless explicitly instructed otherwise.
- If a requested fix is risky or unclear, document it and leave it unchanged.
- Save and push safe progress through the available GitHub/Codex PR workflow before usage or time runs out.
