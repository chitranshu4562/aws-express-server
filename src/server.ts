import { createApp } from "./app.ts";
import { config } from "./config.ts";
import { registerShutdown } from "./lifecycle/shutdown.ts";
import { logger } from "./logger.ts";

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});

registerShutdown(server);
