import { Router } from "express";
import postsRouter from "../modules/posts/posts.routes.ts";
import healthRouter from "./health.ts";
import readyRouter from "./ready.ts";

const router = Router();

router.use(healthRouter);
router.use(readyRouter);
router.use(postsRouter);

export default router;
