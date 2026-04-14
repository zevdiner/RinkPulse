import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.nhle.com' },
      { protocol: 'https', hostname: 'cms.nhl.bamgrid.com' },
    ],
  },
};

export default nextConfig;
