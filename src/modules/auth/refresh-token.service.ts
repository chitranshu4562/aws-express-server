import { randomUUID } from "node:crypto";
import { config } from "../../config.ts";
import { UnauthorizedError } from "../../errors/app-error.ts";
import type { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../../lib/prisma.ts";
import { generateOpaqueToken, hashToken } from "../../lib/tokens.ts";

const TTL_MS = config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

const issue = async (db: Prisma.TransactionClient, userId: string, familyId: string) => {
  const token = generateOpaqueToken();
  await db.refreshToken.create({
    data: { userId, familyId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TTL_MS) },
  });
  return token;
};

const revokeFamily = (familyId: string) =>
  prisma.refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

export const refreshTokenService = {
  // Each login starts a new family; every rotation of that token stays in it.
  create(userId: string) {
    return issue(prisma, userId, randomUUID());
  },

  async rotate(token: string) {
    const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!existing) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // A token that was already used is being presented again, so assume it was stolen.
    if (existing.revokedAt) {
      await revokeFamily(existing.familyId);
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (existing.expiresAt <= new Date()) {
      throw new UnauthorizedError("Refresh token expired");
    }

    const newToken = await prisma.$transaction(async (tx) => {
      // Conditional update: only one of several concurrent requests with the same token can win.
      const { count } = await tx.refreshToken.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return count === 1 ? issue(tx, existing.userId, existing.familyId) : null;
    });

    if (!newToken) {
      await revokeFamily(existing.familyId);
      throw new UnauthorizedError("Invalid refresh token");
    }

    return { userId: existing.userId, refreshToken: newToken };
  },
};
