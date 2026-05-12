import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.js"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.js"],
      exclude: ["src/**/*.test.js"],
      thresholds: {
        statements: 60,
        branches: 49,
        functions: 60,
        lines: 60,
      },
    },
  },
});
