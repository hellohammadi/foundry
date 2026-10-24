import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load the DNotifier SDK and its WebSocket client from node_modules at runtime instead of bundling them.
  serverExternalPackages: ["@dnotifier-realtime/dnotifier", "ws"],
  // The playbook knowledge base and verified facts are read from disk at runtime.
  outputFileTracingIncludes: {
    "/api/diagnose": ["./knowledge/**/*.md"],
    "/api/analyze": ["./knowledge/facts/*.json"],
  },
};

export default nextConfig;
