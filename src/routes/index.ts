import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.ts";
import organizationRoutes from "../modules/organizations/organization.routes.ts";
import userRoutes from "../modules/users/user.routes.ts";
import healthRouter from "./health.ts";

const router = Router();

router.use(healthRouter);
router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/orgs", organizationRoutes);

export default router;
