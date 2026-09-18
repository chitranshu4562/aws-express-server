import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { isShuttingDown } from "../lifecycle/shutdown.ts";
import { logger } from "../logger.ts";

const router = Router();

router.get("/ready", async (_req: Request, res: Response) => {
  if (isShuttingDown()) {
    res.status(503).json({ status: "shutting down" });
    return;
  }

  // Not ready if the database is unreachable
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    logger.error({ err }, "Readiness check failed");
    res.status(503).json({ status: "database unavailable" });
    return;
  }

  res.status(200).json({ status: "ready" });
});

export default router;
