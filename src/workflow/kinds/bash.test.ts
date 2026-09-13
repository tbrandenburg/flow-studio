import { describe, expect, it } from "vitest";
import { bashKind } from "./bash";

describe("bashKind.fromYaml", () => {
  it("parses a minimal bash node", () => {
    const result = bashKind.fromYaml({ bash: "echo hi" });
    expect(result).toEqual({
      kind: "bash",
      label: "Shell",
      script: "echo hi",
      timeout: undefined,
      on_timeout: undefined,
    });
  });

  it("parses on_timeout: skip", () => {
    const result = bashKind.fromYaml({ bash: "echo hi", timeout: 5000, on_timeout: "skip" });
    expect(result?.on_timeout).toBe("skip");
  });

  it("returns null when bash key is missing", () => {
    expect(bashKind.fromYaml({})).toBeNull();
  });
});

describe("bashKind.toYaml", () => {
  it("round-trips on_timeout: skip", () => {
    const parsed = bashKind.fromYaml({ bash: "echo hi", timeout: 5000, on_timeout: "skip" });
    expect(parsed).not.toBeNull();
    const yaml = bashKind.toYaml(parsed as never);
    expect(yaml).toEqual({ bash: "echo hi", timeout: 5000, on_timeout: "skip" });
  });

  it("omits on_timeout when absent", () => {
    const parsed = bashKind.fromYaml({ bash: "echo hi" });
    const yaml = bashKind.toYaml(parsed as never);
    expect(yaml).toEqual({ bash: "echo hi" });
  });
});

describe("bashKind fields", () => {
  it("exposes on_timeout as a select with 'skip' option", () => {
    const field = bashKind.fields.find((f) => f.name === "on_timeout");
    expect(field).toMatchObject({ type: "select", options: ["skip"] });
  });
});
