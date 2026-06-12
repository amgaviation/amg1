# AMG Public Website Deployment Runbook

## Canonical Production Setup

- Vercel project: `amg1`
- GitHub repository: `amgaviation/amg1`
- Production branch: `main`
- Canonical public domain: `https://amgaviation.net`
- Branch used for this remediation: `fix/public-site-production-remediation`

Production must be created by merging the completed remediation branch into `main`. Do not manually promote a feature-branch preview to production for this project.

## Deployment Identification

Use these checks to identify the deployed Git SHA:

1. Open `https://amgaviation.net/api/build-info`.
2. Confirm `gitSha` matches the expected `main` commit.
3. In Vercel, inspect the production deployment for project `amg1` and compare the Git commit shown there.
4. Compare the deployed source branch with `main`; production should not point to a feature branch preview.

The build-info endpoint only exposes non-secret deployment metadata provided by Vercel.

## Preview Versus Production

- Preview deployments are expected for non-production branches and pull requests.
- Production is expected only from `main`.
- Compare preview and production by checking:
  - visible public routes,
  - `/api/build-info`,
  - Vercel deployment Git commit,
  - Vercel deployment branch,
  - canonical URL metadata.

## Avoiding Manual Promotion Conflicts

Do not use `vercel promote` for this remediation unless a future rollback playbook explicitly requires it. Manual promotion can point production aliases at a preview artifact from the wrong branch and make production visually diverge from `main`.

## Safe Rollback

If production deploys the wrong commit:

1. Identify the last known good production deployment in Vercel.
2. Confirm its Git SHA and branch.
3. Prefer a Git revert on `main` followed by a normal Vercel Git deployment.
4. If a fast operational rollback is required, use Vercel rollback to the verified prior production deployment, then follow up with a Git revert so `main` and production converge again.

## Final Verification

After merge to `main`, verify:

- Vercel deployment status is `READY`.
- `https://amgaviation.net/api/build-info` returns the final `main` SHA.
- `https://amgaviation.net` renders the public site and is indexable.
- Preview URLs remain non-canonical and may be noindexed.
- Portal login still loads from `/login`.
