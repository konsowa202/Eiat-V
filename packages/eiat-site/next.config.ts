import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  images: {
    domains: ["placehold.co", "cdn.sanity.io"],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/studio',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
