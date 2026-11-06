// next.config.ts
// Next.js configuration. Currently defines the HTTP security headers sent
// with every response, including a Content-Security-Policy that is
// delivered in report-only mode until its allow-list is confirmed against
// real traffic.

import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

// The browser calls the API directly, so its origin must be allowed in
// connect-src. Derived from the same variable the API client uses.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1").origin;
  } catch {
    return "http://localhost:8000";
  }
})();

// Allow-list rationale:
// - script-src: Next.js emits inline bootstrap scripts, so 'unsafe-inline'
//   is required without per-request nonces; 'unsafe-eval' is dev-only (React
//   refresh). Google Identity Services loads from accounts.google.com.
// - style-src: inline styles from Tailwind/Next plus the Google Fonts
//   stylesheet and the Google sign-in button's stylesheet.
// - img-src / media-src: listing photos and videos come from the storage
//   host and mock data, so any https source is allowed for passive media.
// - frame-ancestors 'none' stops the site being embedded (clickjacking).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} https://accounts.google.com/gsi/client`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  `connect-src 'self' ${apiOrigin} https://accounts.google.com/gsi/`,
  "frame-src https://accounts.google.com/gsi/",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  // The password-reset token travels in the URL query string, so the full
  // URL must never leak to other sites through the Referer header.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Google Identity Services opens a popup that talks back to the opener.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  // HSTS over plain-http localhost would be ignored, but sending it only in
  // production keeps dev responses free of a sticky browser policy.
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
