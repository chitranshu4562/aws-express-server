import { describe, expect, it } from "vitest";
import { hasAtLeastRole } from "../roles.ts";

describe("hasAtLeastRole", () => {
  it.each([
    ["owner", "owner", true],
    ["owner", "admin", true],
    ["owner", "member", true],
    ["admin", "owner", false],
    ["admin", "admin", true],
    ["admin", "member", true],
    ["member", "owner", false],
    ["member", "admin", false],
    ["member", "member", true],
  ] as const)("%s meets %s: %s", (role, minRole, expected) => {
    expect(hasAtLeastRole(role, minRole)).toBe(expected);
  });
});
