import { app } from "./app.ts";
import { config } from "./config.ts";
import { prisma } from "./lib/prisma.ts";
import { logger } from "./logger.ts";

const server = app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
