import { describe, expect, it } from "vitest";
import { getKind, NODE_KINDS } from "./index";

describe("getKind", () => {
  it("returns the matching kind", () => {
    expect(getKind("bash").badge).toBe("BASH");
  });

  it("throws for an unknown kind", () => {
    expect(() => getKind("nope")).toThrow("Unknown node kind: nope");
  });

  it("registers prompt last as the fallback kind", () => {
    expect(NODE_KINDS.at(-1)?.id).toBe("prompt");
  });
});
