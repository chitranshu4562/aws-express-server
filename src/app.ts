import express from "express";
import { requestLogger } from "./middleware/requestLogger.ts";
import routes from "./routes/index.ts";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);
  app.use(routes);

  return app;
}
