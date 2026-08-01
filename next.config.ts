import type { NextConfig } from "next";

const noIndexHeaders = [
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      { source: "/admin", headers: noIndexHeaders },
      { source: "/admin/:path*", headers: noIndexHeaders },
      { source: "/api/:path*", headers: noIndexHeaders },
    ];
  },
};

export default nextConfig;
