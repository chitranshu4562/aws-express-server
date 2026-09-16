import type { MemberRole } from "../generated/prisma/client.ts";

// Adds app-specific properties to Express's Request type (declaration merging).
declare global {
  namespace Express {
    interface Request {
      // Set by the `authenticate` middleware; undefined on public routes.
      user?: { id: string };
      // Set by the `requireOrgRole` middleware on `/orgs/:orgId` routes.
      membership?: { id: string; organizationId: string; role: MemberRole };
    }
  }
}
