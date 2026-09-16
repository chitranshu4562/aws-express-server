import { Router } from "express";
import { validateBody } from "../../middleware/validate.ts";
import { userController } from "./user.controller.ts";
import { signupSchema } from "./user.schema.ts";

const router = Router();

router.post("/signup", validateBody(signupSchema), userController.signup);

export default router;
