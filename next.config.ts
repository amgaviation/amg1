import type { NextConfig } from "next";

// Enforced Content-Security-Policy: the browser blocks any resource whose origin
// is not allowlisted below. Origins mirror the site's real third parties — Supabase
// (auth/realtime/storage), Stripe, the consent-gated analytics in
// components/compliance/consent-script-loader.tsx (GTM/GA, Meta Pixel, Clarity),
// unpkg images, and Vercel's preview toolbar. `script-src`/`style-src` keep
// 'unsafe-inline' (and 'unsafe-eval') because Next.js hydration and the injected
// analytics snippets require inline execution; a nonce-based policy would be the
// next hardening step. To roll back fast, rename this header key to
// `Content-Security-Policy-Report-Only` below.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.clarity.ms https://connect.facebook.net https://js.stripe.com https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://unpkg.com https://*.supabase.co https://www.googletagmanager.com https://*.google-analytics.com https://www.google-analytics.com https://www.facebook.com https://*.clarity.ms https://c.bing.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com https://*.clarity.ms https://c.bing.com https://connect.facebook.net https://www.facebook.com https://api.stripe.com https://vercel.live wss://ws-us3.pusher.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.googletagmanager.com https://vercel.live",
  "media-src 'self' data: blob: https://*.supabase.co",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
  // Violations are POSTed to the app/api/csp-report route (server-side logging).
  // report-to is the modern channel; report-uri is the legacy fallback.
  "report-to csp-endpoint",
  "report-uri /api/csp-report",
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
  // Names the reporting group referenced by the CSP `report-to` directive.
  {
    key: "Reporting-Endpoints",
    value: 'csp-endpoint="/api/csp-report"',
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
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
