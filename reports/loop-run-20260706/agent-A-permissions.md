# Agent A — Speed & Optimization (permissions single pass)

[A-P-01] P2 portal — lib/portal/permissions.ts: fetchPermissionMatrix returns null on failure and unstable_cache CACHES the null for 300s → one transient DB blip silently disables all custom permissions process-wide for 5 min. Fix: throw on error (throws aren't cached) + try/catch fallback to defaults inside effectiveFlags/permissionsForRole. (bug)
[A-P-02] P2 db — lib/portal/session.ts getSessionUser not memoized; every guarded page pays 2× (layout + page guard) × 2 round-trips. Fix: wrap in React cache(). (fix)
[A-P-03] P3 portal — role-layout.tsx: countUnread and permissionsForRole awaited serially; parallelize. (fix)
[A-P-04] P3 portal — full permissions catalog may ship in client shell chunk; consider splitting nav mapping into its own module if not tree-shaken. (feature-suggestion → backlog)
[A-P-05] P3 portal — invalidation VERIFIED correct (updateTag → unstable_cache tag manifest, Next 16.2.9). Caveat: self-hosted multi-instance would need shared cacheHandler; on Vercel fine. revalidatePath redundant but harmless. (no action)
