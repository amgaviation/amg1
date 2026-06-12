# Media Attribution

The current production remediation uses existing local project assets only. No arbitrary images were copied from Google Images, sales listings, charter websites, social media, or photographer websites during this pass.

Aircraft-category sections intentionally use non-photo category treatments because the repository did not contain verified, licensed, category-specific photographs for every class. This avoids showing a piston aircraft for a jet class, a Citation X for light jet, or a piston twin for midsize jet.

Logos are exempt from duplicate-photo rules. Non-exempt public images are checked with:

```bash
npm run media:audit
```

Attribution requirements are not documented for the existing local assets. Before replacing any production image with manufacturer, stock, or third-party photography, add the source, license, attribution requirement, visible-registration status, and approval note to `docs/MEDIA_MANIFEST.csv`.
