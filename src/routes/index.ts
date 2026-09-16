import { Router } from "express";
import userRoutes from "../modules/users/user.routes.ts";
import healthRouter from "./health.ts";

const router = Router();

router.use(healthRouter);
router.use("/users", userRoutes);

export default router;
