import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "unpkg.com",
      },
    ],
  },
  async redirects() {
    // Public IA canonicalized under the AMG rebuild: /services and
    // /pilot-network are the canonical marketing routes; legacy paths
    // redirect to them (page-level redirects cover /capabilities,
    // /operations, and /crew-network).
    return [
      { source: "/aircraft", destination: "/aircraft-support", permanent: false },
      { source: "/team", destination: "/about", permanent: false },
      { source: "/support-plans", destination: "/plans", permanent: false },
    ];
  },
};

export default nextConfig;
