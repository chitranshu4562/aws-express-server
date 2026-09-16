import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.ts";
import { validateBody } from "../../middleware/validate.ts";
import { authController } from "./auth.controller.ts";
import { loginSchema } from "./auth.schema.ts";

const router = Router();

router.post("/login", validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);
router.get("/me", authenticate, authController.me);

export default router;
