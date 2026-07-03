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
    // Preserve legacy public URLs while keeping the simplified marketing IA canonical.
    return [
      { source: "/capabilities", destination: "/services", permanent: false },
      { source: "/support-plans", destination: "/plans", permanent: false },
      { source: "/aircraft", destination: "/aircraft-support", permanent: false },
      { source: "/team", destination: "/about", permanent: false },
    ];
  },
};

export default nextConfig;
