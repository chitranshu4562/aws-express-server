import { execFileSync } from "node:child_process";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

// Runs once per `vitest run`: starts a throwaway Postgres and applies the real migrations to it.
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer("postgres:17-alpine").start();
  const databaseUrl = container.getConnectionUri();

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "ignore",
  });

  project.provide("databaseUrl", databaseUrl);

  return async () => {
    await container.stop();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
