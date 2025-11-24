import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Ensure CSS is properly extracted in production
    optimizeCss: true,
  },
};

export default nextConfig;
