import type { Server } from "node:http";
import { logger } from "../logger.ts";

let shuttingDown = false;

export function isShuttingDown() {
  return shuttingDown;
}

export function registerShutdown(server: Server) {
  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutting down...");

    // Stop accepting new requests, wait for current ones to finish
    server.close(() => {
      logger.info("Shutdown complete");
      process.exit(0);
    });

    // If requests take too long, exit anyway after 10 seconds
    setTimeout(() => process.exit(1), 10_000).unref();
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
