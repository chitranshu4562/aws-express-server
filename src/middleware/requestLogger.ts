import type { Request, Response } from "express";
import { pinoHttp } from "pino-http";
import { logger } from "../logger.ts";

export const requestLogger = pinoHttp<Request, Response>({
  logger,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url.split("?")[0],
    }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
