import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const { findUnique, createRefreshToken } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  createRefreshToken: vi.fn(),
}));
vi.mock("../../../lib/prisma.ts", () => ({
  prisma: { user: { findUnique }, refreshToken: { create: createRefreshToken } },
}));

const { app } = await import("../../../app.ts");
const { signToken } = await import("../../../lib/jwt.ts");

const SECRET = process.env.JWT_SECRET!;
const passwordHash = bcrypt.hashSync("s3cretpass", 4);
const createdAt = new Date("2026-09-16T00:00:00Z");

beforeEach(() => {
  findUnique.mockReset();
  createRefreshToken.mockReset();
});

describe("POST /auth/login", () => {
  it("returns a signed access token and sets the refresh cookie for valid credentials", async () => {
    findUnique.mockResolvedValue({ id: "u1", email: "jane@example.com", passwordHash, createdAt });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: " Jane@Example.com ", password: "s3cretpass" });

    expect(res.status).toBe(200);
    expect(res.body.tokenType).toBe("Bearer");
    expect(jwt.verify(res.body.accessToken, SECRET)).toMatchObject({ sub: "u1" });
    expect(findUnique).toHaveBeenCalledWith({ where: { email: "jane@example.com" } });
    expect(res.body).not.toHaveProperty("refreshToken");

    const cookie = res.headers["set-cookie"]?.[0] ?? "";
    expect(cookie).toMatch(/^refresh_token=[\w-]{43};/);
    expect(cookie).toMatch(/; Path=\/auth;/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(createRefreshToken.mock.calls[0][0].data).toMatchObject({ userId: "u1" });
  });

  it.each([
    ["wrong password", { id: "u1", email: "jane@example.com", passwordHash, createdAt }],
    ["unknown email", null],
  ])("returns the same 401 for %s", async (_label, user) => {
    findUnique.mockResolvedValue(user);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "jane@example.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid email or password" });
  });

  it("returns 400 for an invalid body", async () => {
    const res = await request(app).post("/auth/login").send({ email: "nope" });

    expect(res.status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe("GET /auth/me", () => {
  it("returns the current user for a valid token", async () => {
    findUnique.mockResolvedValue({ id: "u1", email: "jane@example.com", createdAt });

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${signToken("u1")}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "u1", email: "jane@example.com", createdAt: createdAt.toISOString() });
    expect(findUnique.mock.calls[0][0].where).toEqual({ id: "u1" });
  });

  it.each([
    ["no header", undefined],
    ["wrong scheme", "Basic abc"],
    ["garbage token", "Bearer not-a-jwt"],
    ["wrong secret", `Bearer ${jwt.sign({}, "x".repeat(32), { subject: "u1" })}`],
    ["expired token", `Bearer ${jwt.sign({ exp: Math.floor(Date.now() / 1000) - 60 }, SECRET, { subject: "u1" })}`],
    ["alg none", `Bearer ${jwt.sign({}, null, { algorithm: "none", subject: "u1" })}`],
  ])("returns 401 for %s", async (_label, header) => {
    const req = request(app).get("/auth/me");
    const res = await (header ? req.set("Authorization", header) : req);

    expect(res.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns 401 when the user no longer exists", async () => {
    findUnique.mockResolvedValue(null);

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${signToken("gone")}`);

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/refresh", () => {
  it("returns 401 when the refresh cookie is missing", async () => {
    const res = await request(app).post("/auth/refresh");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Missing refresh token" });
  });
});
