import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      LOG_LEVEL: "silent",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
    },
  },
});
