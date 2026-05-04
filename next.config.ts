import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Do NOT remove console logs in production — Railway logs depend on them for debugging
  // compiler: { removeConsole: true },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp)",
        locale: false,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
