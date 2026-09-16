import bcrypt from "bcrypt";
import { UnauthorizedError } from "../../errors/app-error.ts";
import { signToken } from "../../lib/jwt.ts";
import { prisma } from "../../lib/prisma.ts";
import type { LoginInput } from "./auth.schema.ts";
import { refreshTokenService } from "./refresh-token.service.ts";

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

export const authService = {
  async login({ email, password }: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return {
      accessToken: signToken(user.id),
      refreshToken: await refreshTokenService.create(user.id),
    };
  },

  async refresh(token: string) {
    const { userId, refreshToken } = await refreshTokenService.rotate(token);
    return { accessToken: signToken(userId), refreshToken };
  },

  logout(refreshToken: string) {
    return refreshTokenService.revokeSession(refreshToken);
  },

  logoutAll(userId: string) {
    return refreshTokenService.revokeAllForUser(userId);
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    });
    // The token can outlive the account.
    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }
    return user;
  },
};
