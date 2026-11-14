import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The libSQL client loads a native driver; keep it out of the bundle.
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
