import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../config.ts";
import { PrismaClient } from "../generated/prisma/client.ts";

// Prisma 7 talks to Postgres through a driver adapter
const adapter = new PrismaPg({
  connectionString: config.DATABASE_URL,
  // Encrypted, but the server certificate is not checked against a CA
  ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
});

// One client for the whole app: each instance has its own connection pool
export const prisma = new PrismaClient({ adapter });
