import type { Request, Response } from "express";
import { authService } from "./auth.service.ts";

export const authController = {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  },

  async me(req: Request, res: Response) {
    const user = await authService.getCurrentUser(req.user!.id);
    res.status(200).json(user);
  },
};
