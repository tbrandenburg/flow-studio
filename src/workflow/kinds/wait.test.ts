import { describe, expect, it } from "vitest";
import { waitKind } from "./wait";

describe("waitKind.fromYaml", () => {
  it("parses deadline_ms and does not fall through to empty", () => {
    const result = waitKind.fromYaml({ wait: { deadline_ms: 60000 } });
    expect(result).not.toBeNull();
    expect(result?.wait_type).toBe("deadline_ms");
    expect(result?.value).toBe("60000");
  });

  it("still supports legacy duration_ms for backward compatibility", () => {
    const result = waitKind.fromYaml({ wait: { duration_ms: 5000 } });
    expect(result?.wait_type).toBe("duration_ms");
    expect(result?.value).toBe("5000");
  });

  it("returns generic Wait node when wait key is missing", () => {
    expect(waitKind.fromYaml({})).toBeNull();
  });

  it("falls through to empty wait node when no known wait_type key matches", () => {
    const result = waitKind.fromYaml({ wait: { unknown_key: "x" } });
    expect(result).toEqual({ kind: "wait", label: "Wait" });
  });
});

describe("waitKind.toYaml", () => {
  it("round-trips deadline_ms back to YAML", () => {
    const parsed = waitKind.fromYaml({ wait: { deadline_ms: 60000 } });
    expect(parsed).not.toBeNull();
    const yaml = waitKind.toYaml(parsed as never);
    expect(yaml).toEqual({ wait: { deadline_ms: "60000" } });
  });
});
