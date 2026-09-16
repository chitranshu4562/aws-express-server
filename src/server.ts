import express from "express";
import { config } from "./config.ts";
import { logger } from "./logger.ts";
import { requestLogger } from "./middleware/requestLogger.ts";
import routes from "./routes/index.ts";

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(routes);

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
});
