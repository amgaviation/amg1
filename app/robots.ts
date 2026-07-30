import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://amgaviationgroup.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /studio is 3 Green Studios — a separate brand that happens to be
        // served from this deployment until it gets its own domain. Keeping it
        // out of the index avoids two identities competing under one hostname.
        // Remove this entry (and the `robots` block in app/studio/layout.tsx)
        // when the site moves to 3greenstudios.com.
        disallow: ["/portal/", "/api/", "/ops/", "/studio"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
