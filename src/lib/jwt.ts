import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.ts";

const ALGORITHM = "HS256";

export type TokenPayload = { sub: string };

export const signToken = (userId: string) =>
  jwt.sign({}, config.JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: userId,
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });

// Throws if the token is malformed, expired, or signed with a different secret/algorithm.
export const verifyToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: [ALGORITHM] });
  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Invalid token payload");
  }
  return { sub: payload.sub };
};
