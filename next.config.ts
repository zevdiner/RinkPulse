import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent the page from being embedded in an iframe (clickjacking protection)
  { key: 'X-Frame-Options',        value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only send origin on same-origin requests
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  // Disable browser features the site doesn't need
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
  // Tell browsers to always use HTTPS for this domain (after first visit)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.nhle.com' },
      { protocol: 'https', hostname: 'cms.nhl.bamgrid.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
