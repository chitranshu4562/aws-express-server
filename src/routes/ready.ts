import { Router } from "express";
import type { Request, Response } from "express";
import { isShuttingDown } from "../lifecycle/shutdown.ts";

const router = Router();

router.get("/ready", (_req: Request, res: Response) => {
  if (isShuttingDown()) {
    res.status(503).json({ status: "shutting down" });
    return;
  }
  res.status(200).json({ status: "ready" });
});

export default router;
