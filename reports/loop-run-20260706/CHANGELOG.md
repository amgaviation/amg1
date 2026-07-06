# CHANGELOG — loop-run 2026-07-06

## Primary task — role permissions system (LOOP_PLAN §1b)
- 8f7b520 Phase 1: catalog + can() + migration/seed (applied to prod) + database.types.ts sync (fixed 33 pre-existing typecheck errors)
- e5d5d57 Phase 2: /portal/admin/settings/permissions matrix UI + super_admin save + audit old→new
- 3ce8c58 Phase 3+4 core: actor(perm), 25 priority call sites, 75 page guards, nav filtering, /portal/no-access
- 1d9bbf1 Phase 3 complete: remaining 92 call sites wired
