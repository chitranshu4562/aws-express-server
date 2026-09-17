import express from "express";
import { errorHandler } from "./middleware/errorHandler.ts";
import { notFound } from "./middleware/notFound.ts";
import { requestLogger } from "./middleware/requestLogger.ts";
import routes from "./routes/index.ts";

export function createApp() {
  const app = express();

  // Logger first, so every request (even a rejected one) is logged
  app.use(requestLogger);
  app.use(express.json());
  app.use(routes);

  // These must come after the routes
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
