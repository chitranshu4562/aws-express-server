import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.ts";
import { logger } from "../logger.ts";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // Express identifies error middleware by its 4-argument signature.
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
};
