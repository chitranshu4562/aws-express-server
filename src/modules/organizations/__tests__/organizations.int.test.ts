import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../../app.ts";
import type { MemberRole } from "../../../generated/prisma/client.ts";
import { prisma } from "../../../lib/prisma.ts";
import { jane, john, mia, signupAndLogin, type Credentials } from "../../../test/auth-helpers.ts";

const acme = { name: "Acme Inc", slug: "acme" };

const as = (token: string) => ({
  get: (path: string) => request(app).get(path).set("Authorization", `Bearer ${token}`),
  post: (path: string) => request(app).post(path).set("Authorization", `Bearer ${token}`),
  patch: (path: string) => request(app).patch(path).set("Authorization", `Bearer ${token}`),
  delete: (path: string) => request(app).delete(path).set("Authorization", `Bearer ${token}`),
});

type Client = ReturnType<typeof as>;

// Member management endpoints arrive later, so extra roles are inserted directly.
const joinAs = async (user: Credentials, organizationId: string, role: MemberRole) => {
  const { accessToken } = await signupAndLogin(user);
  const { id: userId } = await prisma.user.findUniqueOrThrow({ where: { email: user.email } });
  await prisma.organizationMember.create({ data: { organizationId, userId, role } });
  return as(accessToken);
};

describe("organizations", () => {
  let owner: Client;

  beforeEach(async () => {
    owner = as((await signupAndLogin(jane)).accessToken);
  });

  const createAcme = async () => (await owner.post("/orgs").send(acme).expect(201)).body as { id: string };

  describe("POST /orgs", () => {
    it("creates the organization with the caller as owner", async () => {
      const res = await owner.post("/orgs").send({ name: " Acme Inc ", slug: "ACME" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(String),
        name: "Acme Inc",
        slug: "acme",
        role: "owner",
        createdAt: expect.any(String),
      });
      const members = await prisma.organizationMember.findMany({ where: { organizationId: res.body.id } });
      expect(members).toHaveLength(1);
      expect(members[0].role).toBe("owner");
    });

    it("returns 409 when the slug is taken", async () => {
      await createAcme();

      const res = await owner.post("/orgs").send({ name: "Other", slug: "acme" });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: "Slug already in use" });
    });

    it.each([
      ["bad slug characters", { name: "Acme", slug: "acme_inc!" }],
      ["double hyphen", { name: "Acme", slug: "acme--inc" }],
      ["short slug", { name: "Acme", slug: "ab" }],
      ["blank name", { name: "   ", slug: "acme" }],
    ])("returns 400 for %s", async (_label, body) => {
      await owner.post("/orgs").send(body).expect(400);
      expect(await prisma.organization.count()).toBe(0);
    });

    it("returns 401 without an access token", async () => {
      await request(app).post("/orgs").send(acme).expect(401);
    });
  });

  describe("GET /orgs", () => {
    it("lists only the caller's organizations with their role", async () => {
      const { id } = await createAcme();
      const admin = await joinAs(john, id, "admin");
      await admin.post("/orgs").send({ name: "Johns Org", slug: "johns-org" }).expect(201);

      const janeOrgs = (await owner.get("/orgs").expect(200)).body;
      const johnOrgs = (await admin.get("/orgs").expect(200)).body;

      expect(janeOrgs.map((o: { slug: string; role: string }) => [o.slug, o.role])).toEqual([["acme", "owner"]]);
      expect(johnOrgs.map((o: { slug: string; role: string }) => [o.slug, o.role])).toEqual([
        ["acme", "admin"],
        ["johns-org", "owner"],
      ]);
    });
  });

  describe("GET /orgs/:orgId", () => {
    it("returns the organization and the caller's role to a member", async () => {
      const { id } = await createAcme();
      const member = await joinAs(john, id, "member");

      const res = await member.get(`/orgs/${id}`).expect(200);

      expect(res.body).toMatchObject({ id, slug: "acme", role: "member" });
    });

    it("returns 404 to non-members, the same as for a missing organization", async () => {
      const { id } = await createAcme();
      const outsider = as((await signupAndLogin(john)).accessToken);

      const hidden = await outsider.get(`/orgs/${id}`);
      const missing = await outsider.get("/orgs/00000000-0000-0000-0000-000000000000");

      expect(hidden.status).toBe(404);
      expect(hidden.body).toEqual(missing.body);
    });
  });

  describe("PATCH /orgs/:orgId", () => {
    it.each([
      ["owner", 200],
      ["admin", 200],
      ["member", 403],
    ] as const)("responds to a %s with %i", async (role, status) => {
      const { id } = await createAcme();
      const caller = role === "owner" ? owner : await joinAs(john, id, role);

      const res = await caller.patch(`/orgs/${id}`).send({ name: "Renamed" });

      expect(res.status).toBe(status);
      const { name } = await prisma.organization.findUniqueOrThrow({ where: { id } });
      expect(name).toBe(status === 200 ? "Renamed" : "Acme Inc");
    });

    it("returns 404 to non-members", async () => {
      const { id } = await createAcme();
      const outsider = as((await signupAndLogin(john)).accessToken);

      await outsider.patch(`/orgs/${id}`).send({ name: "Hacked" }).expect(404);
    });

    it("returns 409 when changing to a taken slug", async () => {
      const { id } = await createAcme();
      await owner.post("/orgs").send({ name: "Globex", slug: "globex" }).expect(201);

      await owner.patch(`/orgs/${id}`).send({ slug: "globex" }).expect(409);
    });

    it("returns 400 for an empty update", async () => {
      const { id } = await createAcme();

      await owner.patch(`/orgs/${id}`).send({}).expect(400);
    });

    it("checks the role before validating the body", async () => {
      const { id } = await createAcme();
      const member = await joinAs(john, id, "member");

      await member.patch(`/orgs/${id}`).send({}).expect(403);
    });
  });

  describe("DELETE /orgs/:orgId", () => {
    it("lets the owner delete the organization and its memberships", async () => {
      const { id } = await createAcme();
      await joinAs(john, id, "admin");

      await owner.delete(`/orgs/${id}`).expect(204);

      expect(await prisma.organization.count()).toBe(0);
      expect(await prisma.organizationMember.count()).toBe(0);
      await owner.get(`/orgs/${id}`).expect(404);
    });

    it.each(["admin", "member"] as const)("returns 403 to a %s", async (role) => {
      const { id } = await createAcme();
      const caller = await joinAs(role === "admin" ? john : mia, id, role);

      await caller.delete(`/orgs/${id}`).expect(403);
      expect(await prisma.organization.count()).toBe(1);
    });
  });

  it("applies a role change on the next request without a new token", async () => {
    const { id } = await createAcme();
    const johnClient = await joinAs(john, id, "admin");
    await johnClient.patch(`/orgs/${id}`).send({ name: "By admin" }).expect(200);

    const { id: johnId } = await prisma.user.findUniqueOrThrow({ where: { email: john.email } });
    await prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId: id, userId: johnId } },
      data: { role: "member" },
    });

    await johnClient.patch(`/orgs/${id}`).send({ name: "Again" }).expect(403);
  });
});
