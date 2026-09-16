import bcrypt from "bcrypt";
import { ConflictError } from "../../errors/app-error.ts";
import { prisma } from "../../lib/prisma.ts";
import { isUniqueViolation } from "../../lib/prisma-errors.ts";
import type { SignupInput } from "./user.schema.ts";

const SALT_ROUNDS = 10;

export const userService = {
  async signup({ email, password }: SignupInput) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      return await prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true, createdAt: true },
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictError("Email already in use");
      }
      throw err;
    }
  },
};
