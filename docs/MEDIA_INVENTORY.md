# Media Inventory

Major production media is tracked in [lib/media/manifest.ts](../lib/media/manifest.ts).

Current audit command:

```bash
npm run media:audit
```

The audit checks:

- duplicate manifest IDs;
- missing manifest files;
- repeated manifest paths;
- identical media binaries with different names.

Known follow-up:

- The manifest still needs to be expanded to include every public-page hero, CTA, portal hero, and aircraft category placement.
- Generated or approved Higgsfield assets should be recorded with `sourcePath`, dimensions, alt text, and art direction before final launch.
