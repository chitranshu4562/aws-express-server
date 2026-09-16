import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.ts";
import { validateBody } from "../../middleware/validate.ts";
import { organizationController } from "./organization.controller.ts";
import { createOrganizationSchema, updateOrganizationSchema } from "./organization.schema.ts";
import { requireOrgRole } from "./require-org-role.ts";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(createOrganizationSchema), organizationController.create);
router.get("/", organizationController.list);
router.get("/:orgId", requireOrgRole("member"), organizationController.get);
router.patch(
  "/:orgId",
  requireOrgRole("admin"),
  validateBody(updateOrganizationSchema),
  organizationController.update,
);
router.delete("/:orgId", requireOrgRole("owner"), organizationController.delete);

export default router;
