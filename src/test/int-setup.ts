import { afterAll, beforeEach, inject } from "vitest";

// Must be set before anything imports config.ts, which is why prisma is imported dynamically below.
process.env.DATABASE_URL = inject("databaseUrl");

const { prisma } = await import("../lib/prisma.ts");

beforeEach(async () => {
  // Cascades to every table that references users.
  await prisma.$executeRawUnsafe("TRUNCATE TABLE users CASCADE");
});

afterAll(async () => {
  await prisma.$disconnect();
});
