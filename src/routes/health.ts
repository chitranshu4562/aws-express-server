import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

export default router;
