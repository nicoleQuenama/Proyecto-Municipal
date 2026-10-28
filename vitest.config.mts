import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["app/**/*.test.ts"],
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
});
