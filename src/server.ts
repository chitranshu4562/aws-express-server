import { createApp } from "./app.ts";
import { config } from "./config.ts";
import { logger } from "./logger.ts";

const app = createApp();

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});
