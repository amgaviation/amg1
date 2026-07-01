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
    // Public IA renamed under the AMG Operations Command rebuild.
    return [
      { source: "/services", destination: "/operations", permanent: false },
      { source: "/aircraft", destination: "/aircraft-support", permanent: false },
      { source: "/pilot-network", destination: "/crew-network", permanent: false },
      { source: "/team", destination: "/about", permanent: false },
    ];
  },
};

export default nextConfig;
