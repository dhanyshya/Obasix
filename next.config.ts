import type { NextConfig } from "next";
import path from "path";
import { adminAppUrl, fastApiConfig } from "./src/lib/fastApi";

// Fails the build on a bad FastAPI migration setting; src/proxy.ts does the forwarding.
fastApiConfig();
adminAppUrl();

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
    // Every image is served from public/: no remote image hosts are allowed.
  },
};

export default nextConfig;
