import type { NextConfig } from "next";

/**
 * Two modes:
 *  - normal:   hosted multi-client platform (admin panel + database)
 *  - FACTORY=1: builds ONE client's website as plain static files (no server needed)
 */
const factory = process.env.FACTORY === "1";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(factory
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        distDir: process.env.FACTORY_OUT ?? ".factory-out",
        pageExtensions: ["static.tsx", "static.ts"],
        typescript: { ignoreBuildErrors: true }, // platform code is type-checked by the normal build
      }
    : {
        serverExternalPackages: ["@libsql/client", "libsql", "sharp"],
        experimental: { serverActions: { bodySizeLimit: "2mb" } },
      }),
};

export default nextConfig;
