import { ConflictError, NotFoundError } from "../../errors/app-error.ts";
import { prisma } from "../../lib/prisma.ts";
import { isRecordNotFound, isUniqueViolation } from "../../lib/prisma-errors.ts";
import type { CreateOrganizationInput, UpdateOrganizationInput } from "./organization.schema.ts";

const organizationSelect = { id: true, name: true, slug: true, createdAt: true } as const;

// Turns known Prisma errors into API errors; rethrows anything else.
const mapWriteError = (err: unknown): never => {
  if (isUniqueViolation(err)) throw new ConflictError("Slug already in use");
  // The organization was deleted between the role check and this write.
  if (isRecordNotFound(err)) throw new NotFoundError("Organization not found");
  throw err;
};

export const organizationService = {
  async create(userId: string, data: CreateOrganizationInput) {
    try {
      // Nested write: the organization and the owner membership are created atomically.
      const organization = await prisma.organization.create({
        data: { ...data, members: { create: { userId, role: "owner" } } },
        select: organizationSelect,
      });
      return { ...organization, role: "owner" as const };
    } catch (err) {
      return mapWriteError(err);
    }
  },

  async listForUser(userId: string) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      select: { role: true, organization: { select: organizationSelect } },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map(({ role, organization }) => ({ ...organization, role }));
  },

  async get(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: organizationSelect,
    });
    if (!organization) {
      throw new NotFoundError("Organization not found");
    }
    return organization;
  },

  async update(organizationId: string, data: UpdateOrganizationInput) {
    try {
      return await prisma.organization.update({
        where: { id: organizationId },
        data,
        select: organizationSelect,
      });
    } catch (err) {
      return mapWriteError(err);
    }
  },

  async delete(organizationId: string) {
    try {
      // Memberships are removed by the ON DELETE CASCADE foreign key.
      await prisma.organization.delete({ where: { id: organizationId } });
    } catch (err) {
      mapWriteError(err);
    }
  },

  findMembership(organizationId: string, userId: string) {
    return prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { id: true, organizationId: true, role: true },
    });
  },
};
