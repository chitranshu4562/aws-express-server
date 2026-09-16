import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("config", () => {
  it("defaults PORT to 3000 when unset", async () => {
    delete process.env.PORT;

    const { config } = await import("../config.ts");

    expect(config.PORT).toBe(3000);
  });

  it("coerces a numeric PORT string from the environment", async () => {
    process.env.PORT = "4321";

    const { config } = await import("../config.ts");

    expect(config.PORT).toBe(4321);
  });

  it("throws when PORT is out of range", async () => {
    process.env.PORT = "99999";

    await expect(import("../config.ts")).rejects.toBeDefined();
  });
});
