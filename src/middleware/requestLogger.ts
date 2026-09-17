import type { Request, Response } from "express";
import { pinoHttp } from "pino-http";
import { logger } from "../logger.ts";

export const requestLogger = pinoHttp<Request, Response>({
  logger,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      // Request body is not logged: it can contain passwords and tokens
    }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
