import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL ?? "http://hadirin.test";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kamera hanya boleh dipakai halaman kita sendiri (untuk scan QR)
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND}/api/:path*` },
      { source: "/sanctum/:path*", destination: `${BACKEND}/sanctum/:path*` },
    ];
  },
};

export default nextConfig;