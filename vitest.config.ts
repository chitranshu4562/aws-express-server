import { configDefaults, defineConfig } from "vitest/config";

const INTEGRATION_TESTS = "src/**/*.int.test.ts";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      LOG_LEVEL: "silent",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
      // Unit tests mock Prisma, so this is never connected to. Integration tests override it.
      DATABASE_URL: "postgresql://unused:unused@localhost:5432/unused",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          exclude: [...configDefaults.exclude, INTEGRATION_TESTS],
        },
      },
      {
        extends: true,
        test: {
          name: "int",
          include: [INTEGRATION_TESTS],
          globalSetup: ["src/test/int-global-setup.ts"],
          setupFiles: ["src/test/int-setup.ts"],
          // All files share one database, so run them one at a time.
          fileParallelism: false,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
