import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Soroban contract bindings ship as TypeScript from a workspace package.
  transpilePackages: ["@molotov/stellar-client"],
  // Storacha's client (UCAN/ucanto graph) is server-only; keep it out of the
  // bundle and require it at runtime in the route handler.
  serverExternalPackages: ["@storacha/client"],
};

export default nextConfig;
