import type { NextConfig } from "next";

// Content-Security-Policy shipped in **Report-Only** mode: the browser reports
// violations to the console but never blocks a resource, so it cannot break the
// portal. Origins mirror the site's real third parties (Supabase, Stripe, the
// consent-gated analytics in components/compliance/consent-script-loader.tsx,
// and unpkg images). Tighten and promote to an enforced `Content-Security-Policy`
// header once the console is clean across public site + portal.
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  // Next.js hydration + the injected analytics snippets need inline/eval.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.clarity.ms https://connect.facebook.net https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://unpkg.com https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://www.facebook.com https://*.clarity.ms https://c.bing.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://*.clarity.ms https://c.bing.com https://connect.facebook.net https://www.facebook.com https://api.stripe.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.googletagmanager.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Applied to every route. HSTS is already emitted by Vercel; we restate it with
// includeSubDomains here so it is explicit and travels with the app config.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
];

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
