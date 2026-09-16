import { createHash, randomBytes } from "node:crypto";

// 256 bits of randomness, so a fast hash is safe to store (unlike low-entropy passwords).
export const generateOpaqueToken = () => randomBytes(32).toString("base64url");

// Deterministic, so a presented token can be looked up by its hash.
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
