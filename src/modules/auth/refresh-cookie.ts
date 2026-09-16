import type { CookieOptions, Request, Response } from "express";
import { config } from "../../config.ts";

const REFRESH_COOKIE = "refresh_token";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  // Browsers drop Secure cookies over plain http, which local dev uses.
  secure: config.NODE_ENV === "production",
  sameSite: "strict",
  path: "/auth",
  maxAge: config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

export const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE, token, cookieOptions);
};

export const clearRefreshCookie = (res: Response) => {
  // The browser only removes the cookie if name, path and flags match the ones it was set with.
  const { maxAge: _maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie(REFRESH_COOKIE, clearOptions);
};

export const readRefreshCookie = (req: Request): string | undefined => {
  const token: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof token === "string" && token.length > 0 ? token : undefined;
};
