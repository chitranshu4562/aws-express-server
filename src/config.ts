import { config as loadEnv } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV !== "production") {
  loadEnv({ quiet: true });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).optional(),
  // Number of proxies in front of the app (1 behind an AWS load balancer)
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const result = envSchema.safeParse(process.env);

// Stop at startup with a readable message if any variable is invalid
if (!result.success) {
  console.error("Invalid environment variables:\n" + z.prettifyError(result.error));
  process.exit(1);
}

export const config = result.data;
export const isProduction = config.NODE_ENV === "production";
