import { app } from "./app.ts";
import { config } from "./config.ts";
import { logger } from "./logger.ts";

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});
