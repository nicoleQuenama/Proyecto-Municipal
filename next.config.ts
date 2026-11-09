import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Un solo proceso de trabajo: en equipos con poca memoria, varios hacían que Next se cayera (y Monaco no cargaba).
    cpus: 1,
  },
  cacheComponents: true,
  // esbuild es un binario nativo, postgres abre conexiones y los clientes FTP/SFTP usan sockets y módulos nativos opcionales, y sharp y ffmpeg-static (compresión de imágenes y videos) son binarios nativos: se usan desde el servidor, no se empaquetan.
  serverExternalPackages: ["esbuild", "postgres", "ssh2", "ssh2-sftp-client", "basic-ftp", "sharp", "ffmpeg-static"],
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
