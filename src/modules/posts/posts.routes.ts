import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.ts";
import * as postsController from "./posts.controller.ts";

const router = Router();

router.post("/posts", asyncHandler(postsController.create));
router.get("/posts", asyncHandler(postsController.list));
router.get("/posts/:id", asyncHandler(postsController.getById));
router.patch("/posts/:id", asyncHandler(postsController.update));
router.delete("/posts/:id", asyncHandler(postsController.remove));

export default router;
