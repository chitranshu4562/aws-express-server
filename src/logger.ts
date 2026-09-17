import pino from "pino";
import { config, isProduction } from "./config.ts";

export const logger = pino({
  level: config.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  transport: isProduction
    ? undefined
    : { target: "pino-pretty", options: { colorize: true } },
});
