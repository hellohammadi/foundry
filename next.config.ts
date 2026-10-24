import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load the DNotifier SDK from node_modules at runtime instead of bundling it.
  serverExternalPackages: ["@dnotifier-realtime/dnotifier"],
};

export default nextConfig;
