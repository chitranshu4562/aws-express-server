import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, NotFoundError } from "../../errors/app-error.ts";
import type { MemberRole } from "../../generated/prisma/client.ts";
import { organizationService } from "./organization.service.ts";
import { hasAtLeastRole } from "./roles.ts";

/**
 * Loads the caller's membership in `:orgId` and requires at least `minRole`.
 * Must run after `authenticate`. The role is read from the database on every request
 * (not from the JWT), so role changes and removals take effect immediately.
 */
export const requireOrgRole =
  (minRole: MemberRole) => async (req: Request, _res: Response, next: NextFunction) => {
    const orgId = req.params.orgId;
    if (typeof orgId !== "string") {
      throw new Error("requireOrgRole used on a route without an :orgId parameter");
    }

    const membership = await organizationService.findMembership(orgId, req.user!.id);
    // 404, not 403, so outsiders can't tell whether the organization exists.
    if (!membership) {
      throw new NotFoundError("Organization not found");
    }
    if (!hasAtLeastRole(membership.role, minRole)) {
      throw new ForbiddenError(`Requires ${minRole} role or higher`);
    }

    req.membership = membership;
    next();
  };
