import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["node:sqlite"],
  async redirects() {
    return [{ source: "/projects", destination: "/", permanent: false }];
  },
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
    ],
  },
};

export default nextConfig;
