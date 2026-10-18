import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Un solo proceso de trabajo: en equipos con poca memoria, varios hacían que Next se cayera (y Monaco no cargaba).
    cpus: 1,
  },
  cacheComponents: true,
  // esbuild es un binario nativo: se usa desde el servidor (app/api/libs/bundle), no se empaqueta.
  serverExternalPackages: ["esbuild"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
