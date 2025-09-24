import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(rootDir, "."),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["lib/**/*.test.ts"],
    // Limit concurrency to prevent multiple vitest instances
    maxWorkers: 2,
    minWorkers: 1,
    // Disable watch mode in CI to prevent hanging processes
    watch: false,
  },
});