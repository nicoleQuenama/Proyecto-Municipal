import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Un solo proceso de trabajo: en equipos con poca memoria, varios hacían que Next se cayera (y Monaco no cargaba).
    cpus: 1,
  },
  cacheComponents: true,
  // esbuild es un binario nativo y postgres abre conexiones: se usan desde el servidor, no se empaquetan.
  serverExternalPackages: ["esbuild", "postgres"],
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
