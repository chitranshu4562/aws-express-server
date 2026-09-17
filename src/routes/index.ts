import { Router } from "express";
import healthRouter from "./health.ts";
import readyRouter from "./ready.ts";

const router = Router();

router.use(healthRouter);
router.use(readyRouter);

export default router;
