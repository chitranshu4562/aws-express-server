import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../../app.ts";
import { prisma } from "../../../lib/prisma.ts";
import { hashToken } from "../../../lib/tokens.ts";
import * as auth from "../../../test/auth-helpers.ts";
import { jane, refresh, refreshTokenFrom } from "../../../test/auth-helpers.ts";

const signupAndLogin = async () => (await auth.signupAndLogin(jane)).refreshToken;
const login = async () => (await auth.login(jane)).refreshToken;

const rowFor = (token: string) =>
  prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: hashToken(token) } });

describe("refresh token rotation", () => {
  it("stores only the hash of the token issued at login", async () => {
    const token = await signupAndLogin();

    const row = await rowFor(token);
    expect(row.tokenHash).not.toBe(token);
    expect(row.revokedAt).toBeNull();
  });

  it("issues a new access token and rotates the refresh token", async () => {
    const oldToken = await signupAndLogin();

    const res = await refresh(oldToken).expect(200);
    const newToken = refreshTokenFrom(res);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(newToken).not.toBe(oldToken);
    expect((await rowFor(oldToken)).revokedAt).not.toBeNull();

    const newRow = await rowFor(newToken);
    expect(newRow.revokedAt).toBeNull();
    expect(newRow.familyId).toBe((await rowFor(oldToken)).familyId);

    // The access token works on a protected route.
    await request(app).get("/auth/me").set("Authorization", `Bearer ${res.body.accessToken}`).expect(200);
  });

  it("revokes the whole family when a used token is presented again", async () => {
    const oldToken = await signupAndLogin();
    const newToken = refreshTokenFrom(await refresh(oldToken).expect(200));

    await refresh(oldToken).expect(401);

    // The legitimate holder of the latest token is logged out too.
    await refresh(newToken).expect(401);
    expect((await rowFor(newToken)).revokedAt).not.toBeNull();
  });

  it("lets only one of two concurrent refreshes with the same token succeed", async () => {
    const token = await signupAndLogin();

    // Hold both lookups until each has read the still-valid row, so both requests reach the revoke step.
    const delegate = prisma.refreshToken;
    const findUnique = delegate.findUnique.bind(delegate);
    let arrived = 0;
    let releaseBoth!: () => void;
    const bothRead = new Promise<void>((resolve) => (releaseBoth = resolve));
    const spy = vi.spyOn(delegate, "findUnique").mockImplementation((async (args: never) => {
      const row = await findUnique(args);
      if (++arrived === 2) releaseBoth();
      await bothRead;
      return row;
    }) as never);

    let statuses: number[];
    try {
      statuses = (await Promise.all([refresh(token), refresh(token)])).map((r) => r.status);
    } finally {
      spy.mockRestore();
    }

    expect(arrived).toBe(2);
    expect(statuses.sort()).toEqual([200, 401]);
    const active = await prisma.refreshToken.count({ where: { revokedAt: null } });
    expect(active).toBe(0);
  });

  it("does not affect other login sessions when one family is revoked", async () => {
    const tokenA = await signupAndLogin();
    const tokenB = await login();

    await refresh(tokenA).expect(200);
    await refresh(tokenA).expect(401);

    await refresh(tokenB).expect(200);
  });

  it("rejects an expired token", async () => {
    const token = await signupAndLogin();
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(token) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await refresh(token);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Refresh token expired" });
  });

  it("rejects an unknown token", async () => {
    await refresh("not-a-real-token").expect(401);
  });

  it("deletes a user's refresh tokens when the user is deleted", async () => {
    const token = await signupAndLogin();

    await prisma.user.delete({ where: { email: jane.email } });

    expect(await prisma.refreshToken.count()).toBe(0);
    await refresh(token).expect(401);
  });
});
