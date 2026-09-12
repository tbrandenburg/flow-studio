import { describe, expect, it } from "vitest";
import { getKind, NODE_KINDS } from "./index";

describe("getKind", () => {
  it("returns the matching kind", () => {
    expect(getKind("bash").badge).toBe("BASH");
  });

  it("throws for an unknown kind", () => {
    expect(() => getKind("nope")).toThrow("Unknown node kind: nope");
  });

  it("registers unknown last as the catch-all fallback kind", () => {
    expect(NODE_KINDS.at(-1)?.id).toBe("unknown");
  });

  it("registers prompt second-to-last, just before the unknown fallback", () => {
    expect(NODE_KINDS.at(-2)?.id).toBe("prompt");
  });
});
