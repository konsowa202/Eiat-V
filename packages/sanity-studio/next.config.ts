import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  images: {
    domains: ["placehold.co", "cdn.sanity.io"],
  },
};

export default nextConfig;
