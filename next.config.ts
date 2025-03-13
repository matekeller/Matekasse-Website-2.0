import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        statusCode: 301,
        source: "/_error",
        destination: "/",
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "https://api.matekasse.de/:path*", // External API
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "nx49890.your-storageshare.de" },
      { protocol: "https", hostname: "cdn.gero.dev" },
      { protocol: "https", hostname: "cloud.librico.org" },
      { protocol: "https", hostname: "msrd0.de" }
    ],
  },
};

export default nextConfig;
