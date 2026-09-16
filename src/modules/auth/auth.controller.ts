import type { Request, Response } from "express";
import { UnauthorizedError } from "../../errors/app-error.ts";
import { authService } from "./auth.service.ts";
import { readRefreshCookie, setRefreshCookie } from "./refresh-cookie.ts";

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

  async me(req: Request, res: Response) {
    const user = await authService.getCurrentUser(req.user!.id);
    res.status(200).json(user);
  },
};
