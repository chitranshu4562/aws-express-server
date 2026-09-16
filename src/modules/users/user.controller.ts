import type { Request, Response } from "express";
import { userService } from "./user.service.ts";
import type { SignupInput } from "./user.schema.ts";

export const userController = {
  async signup(req: Request, res: Response) {
    const user = await userService.signup(req.body);
    res.status(201).json(user);
  },
};
