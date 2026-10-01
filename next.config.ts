import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL ?? "http://hadirin.test";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND}/api/:path*` },
      { source: "/sanctum/:path*", destination: `${BACKEND}/sanctum/:path*` },
    ];
  },
};

export default nextConfig;