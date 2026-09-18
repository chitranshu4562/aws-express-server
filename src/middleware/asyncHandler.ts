import type { RequestHandler } from "express";

// Express 4 ignores rejected promises, so pass the error to the error handler
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
