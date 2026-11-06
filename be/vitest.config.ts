import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // run test files sequentially so DB state is predictable
    pool: "forks",
    // singleFork: true,
    // give each suite enough time to hit a real DB
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // only pick up files under src/__tests__
    include: ["src/__tests__/**/*.test.ts"],
    env: { NODE_ENV: "test" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
