import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../../app.ts";
import { prisma } from "../../../lib/prisma.ts";
import { jane, john, login, logout, refresh, refreshTokenFrom, signup, signupAndLogin } from "../../../test/auth-helpers.ts";

describe("POST /auth/logout", () => {
  it("revokes the session's token family and clears the cookie", async () => {
    const { refreshToken } = await signupAndLogin(jane);
    // Rotate once, so the family has more than one token.
    const rotated = refreshTokenFrom(await refresh(refreshToken).expect(200));

    const res = await logout(rotated).expect(204);

    expect(res.headers["set-cookie"]?.[0]).toMatch(/^refresh_token=;.*Expires=Thu, 01 Jan 1970/);
    await refresh(rotated).expect(401);
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(0);
  });

  it("leaves the user's other sessions logged in", async () => {
    const laptop = await signupAndLogin(jane);
    const phone = await login(jane);

    await logout(laptop.refreshToken).expect(204);

    await refresh(laptop.refreshToken).expect(401);
    await refresh(phone.refreshToken).expect(200);
  });

  it("returns 204 for an unknown token and changes nothing", async () => {
    const session = await signupAndLogin(jane);

    await logout("not-a-real-token").expect(204);

    await refresh(session.refreshToken).expect(200);
  });
});

describe("POST /auth/logout-all", () => {
  it("revokes every session of the current user only", async () => {
    const laptop = await signupAndLogin(jane);
    const phone = await login(jane);
    await signup(john);
    const johnSession = await login(john);

    const res = await request(app)
      .post("/auth/logout-all")
      .set("Authorization", `Bearer ${laptop.accessToken}`)
      .expect(204);

    expect(res.headers["set-cookie"]?.[0]).toMatch(/^refresh_token=;/);
    await refresh(laptop.refreshToken).expect(401);
    await refresh(phone.refreshToken).expect(401);
    await refresh(johnSession.refreshToken).expect(200);
  });
});
