import cookieParser from "cookie-parser";
import express from "express";
import { errorHandler } from "./middleware/error-handler.ts";
import { requestLogger } from "./middleware/requestLogger.ts";
import routes from "./routes/index.ts";

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use(routes);
app.use(errorHandler);
