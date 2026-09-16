import type { Request, Response } from "express";
import { UnauthorizedError } from "../../errors/app-error.ts";
import { authService } from "./auth.service.ts";
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from "./refresh-cookie.ts";

export const authController = {
  async login(req: Request, res: Response) {
    const { accessToken, refreshToken } = await authService.login(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken, tokenType: "Bearer" });
  },

  async refresh(req: Request, res: Response) {
    const token = readRefreshCookie(req);
    if (!token) {
      throw new UnauthorizedError("Missing refresh token");
    }
    const { accessToken, refreshToken } = await authService.refresh(token);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken, tokenType: "Bearer" });
  },

  // Always 204, so repeating it is harmless and it reveals nothing about the token.
  async logout(req: Request, res: Response) {
    const token = readRefreshCookie(req);
    if (token) {
      await authService.logout(token);
    }
    clearRefreshCookie(res);
    res.status(204).end();
  },

  async logoutAll(req: Request, res: Response) {
    await authService.logoutAll(req.user!.id);
    clearRefreshCookie(res);
    res.status(204).end();
  },

  async me(req: Request, res: Response) {
    const user = await authService.getCurrentUser(req.user!.id);
    res.status(200).json(user);
  },
};
