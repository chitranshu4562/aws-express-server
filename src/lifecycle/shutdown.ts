import type { Server } from "node:http";
import { isProduction } from "../config.ts";
import { logger } from "../logger.ts";

// In production, wait before closing so the load balancer sees /ready return 503
const DRAIN_DELAY_MS = isProduction ? 5_000 : 0;

let shuttingDown = false;

export function isShuttingDown() {
  return shuttingDown;
}

export function registerShutdown(server: Server) {
  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutting down...");

    setTimeout(() => {
      // Stop accepting new requests, wait for current ones to finish
      server.close(() => {
        logger.info("Shutdown complete");
        process.exit(0);
      });
    }, DRAIN_DELAY_MS);

    // If requests take too long, exit anyway after 10 more seconds
    setTimeout(() => process.exit(1), DRAIN_DELAY_MS + 10_000).unref();
  }

  function crash(err: unknown) {
    logger.fatal({ err }, "Unexpected error, exiting");
    process.exit(1);
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  process.on("unhandledRejection", crash);
  process.on("uncaughtException", crash);
}
