import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/app-error.ts";
import { verifyToken } from "../lib/jwt.ts";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Missing bearer token");
  }

  try {
    req.user = { id: verifyToken(token).sub };
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
  next();
};
