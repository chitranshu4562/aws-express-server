import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.ts";

describe("GET /health", () => {
  it("returns 200 with status ok and an uptime", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });
});
