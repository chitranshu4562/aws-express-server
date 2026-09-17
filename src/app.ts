import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.ts";
import { notFound } from "./middleware/notFound.ts";
import { requestLogger } from "./middleware/requestLogger.ts";
import routes from "./routes/index.ts";

export function createApp() {
  const app = express();

  // Logger first, so every request (even a rejected one) is logged
  app.use(requestLogger);
  // Secure HTTP headers, and hides "X-Powered-By: Express"
  app.use(helmet());
  // Reject request bodies larger than 100kb
  app.use(express.json({ limit: "100kb" }));
  app.use(routes);

  // These must come after the routes
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
