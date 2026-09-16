import { config as loadEnv } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV !== "production") {
  loadEnv({ quiet: true });
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
});

export const config = envSchema.parse(process.env);
