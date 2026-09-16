import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { Prisma } from "../../../generated/prisma/client.ts";

const create = vi.hoisted(() => vi.fn());
vi.mock("../../../lib/prisma.ts", () => ({ prisma: { user: { create } } }));

const { app } = await import("../../../app.ts");

beforeEach(() => {
  create.mockReset();
});

describe("POST /users/signup", () => {
  it("creates a user with a hashed password and returns 201 without the hash", async () => {
    const createdAt = new Date("2026-09-16T00:00:00Z");
    create.mockImplementation(async ({ data }) => ({ id: "u1", email: data.email, createdAt }));

    const res = await request(app)
      .post("/users/signup")
      .send({ email: "  Jane@Example.com ", password: "s3cretpass" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "u1", email: "jane@example.com", createdAt: createdAt.toISOString() });

    const { data } = create.mock.calls[0][0];
    expect(data.passwordHash).not.toBe("s3cretpass");
    expect(await bcrypt.compare("s3cretpass", data.passwordHash)).toBe(true);
  });

  it.each([
    ["invalid email", { email: "nope", password: "s3cretpass" }],
    ["short password", { email: "jane@example.com", password: "short" }],
    ["missing fields", {}],
  ])("returns 400 for %s", async (_label, body) => {
    const res = await request(app).post("/users/signup").send(body);

    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("returns 409 when the email is already registered", async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const res = await request(app)
      .post("/users/signup")
      .send({ email: "jane@example.com", password: "s3cretpass" });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Email already in use" });
  });

  it("returns 500 on unexpected database errors", async () => {
    create.mockRejectedValue(new Error("connection lost"));

    const res = await request(app)
      .post("/users/signup")
      .send({ email: "jane@example.com", password: "s3cretpass" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
