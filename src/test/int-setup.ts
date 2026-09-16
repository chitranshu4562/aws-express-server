import { afterAll, beforeEach, inject } from "vitest";

// Must be set before anything imports config.ts, which is why prisma is imported dynamically below.
process.env.DATABASE_URL = inject("databaseUrl");

const { prisma } = await import("../lib/prisma.ts");

beforeEach(async () => {
  // CASCADE also empties every table that references these.
  await prisma.$executeRawUnsafe("TRUNCATE TABLE users, organizations CASCADE");
});

afterAll(async () => {
  await prisma.$disconnect();
});
