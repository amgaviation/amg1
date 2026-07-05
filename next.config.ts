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
    // Business-plan rebuild: old IA 301s to the nearest equivalent (spec §13).
    return [
      { source: "/plans", destination: "/pricing", permanent: true },
      { source: "/capabilities", destination: "/how-it-works", permanent: true },
      { source: "/operations", destination: "/how-it-works", permanent: true },
      { source: "/services", destination: "/how-it-works", permanent: true },
      { source: "/aircraft", destination: "/how-it-works", permanent: true },
      { source: "/aircraft-support", destination: "/how-it-works", permanent: true },
      { source: "/about", destination: "/team", permanent: true },
      { source: "/crew-network", destination: "/pilots", permanent: true },
      { source: "/crew-network/apply", destination: "/pilots/apply", permanent: true },
      { source: "/pilot-network", destination: "/pilots", permanent: true },
      { source: "/booking-request", destination: "/request", permanent: true },
      { source: "/request-support", destination: "/request", permanent: true },
      { source: "/contact", destination: "/request", permanent: true },
      { source: "/faqs", destination: "/pricing", permanent: true },
      { source: "/amg-connect", destination: "/connect", permanent: true },
      // /connect is the spec's portal entry; the portal login lives at /login.
      { source: "/connect", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;
