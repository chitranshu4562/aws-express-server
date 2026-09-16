import { Prisma } from "../generated/prisma/client.ts";

// https://www.prisma.io/docs/orm/reference/error-reference
export const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

export const isRecordNotFound = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025";
