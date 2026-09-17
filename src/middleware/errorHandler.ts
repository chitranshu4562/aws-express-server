import { STATUS_CODES } from "node:http";
import type { NextFunction, Request, Response } from "express";

type HttpError = Error & { status?: number };

// Express treats a middleware with 4 arguments as the error handler
export function errorHandler(err: HttpError, req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? 500;

  // Full details go to the logs, only the generic status text goes to the client
  req.log.error({ err }, "Request failed");
  res.status(status).json({ error: STATUS_CODES[status] });
}
