import { Router } from "express";
import healthRouter from "./health.ts";

const router = Router();

router.use(healthRouter);

export default router;
