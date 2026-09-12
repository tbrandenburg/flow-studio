import { describe, expect, it } from "vitest";
import { waitKind } from "./wait";

describe("waitKind.fromYaml", () => {
  it("parses duration_ms", () => {
    const result = waitKind.fromYaml({ wait: { duration_ms: 5000 } });
    expect(result).toEqual({ kind: "wait", label: "Wait", duration_ms: 5000 });
  });

  it("parses until", () => {
    const result = waitKind.fromYaml({ wait: { until: "2026-01-01T00:00:00Z" } });
    expect(result).toEqual({ kind: "wait", label: "Wait", until: "2026-01-01T00:00:00Z" });
  });

  it("parses event and deadline_ms together, preserving both fields", () => {
    const result = waitKind.fromYaml({ wait: { event: "ci_passed", deadline_ms: 600000 } });
    expect(result).toEqual({
      kind: "wait",
      label: "Wait",
      event: "ci_passed",
      deadline_ms: 600000,
    });
  });

  it("parses attention", () => {
    const result = waitKind.fromYaml({ wait: { attention: "need human review" } });
    expect(result).toEqual({ kind: "wait", label: "Wait", attention: "need human review" });
  });

  it("returns null when wait key is missing", () => {
    expect(waitKind.fromYaml({})).toBeNull();
  });

  it("falls through to empty wait node when no known variant key matches", () => {
    const result = waitKind.fromYaml({ wait: { unknown_key: "x" } });
    expect(result).toEqual({ kind: "wait", label: "Wait" });
  });
});

describe("waitKind.toYaml", () => {
  it("round-trips duration_ms", () => {
    const parsed = waitKind.fromYaml({ wait: { duration_ms: 5000 } });
    const yaml = waitKind.toYaml(parsed as never);
    expect(yaml).toEqual({ wait: { duration_ms: 5000 } });
  });

  it("round-trips until", () => {
    const parsed = waitKind.fromYaml({ wait: { until: "2026-01-01T00:00:00Z" } });
    const yaml = waitKind.toYaml(parsed as never);
    expect(yaml).toEqual({ wait: { until: "2026-01-01T00:00:00Z" } });
  });

  it("round-trips event+deadline_ms without dropping either field", () => {
    const parsed = waitKind.fromYaml({ wait: { event: "ci_passed", deadline_ms: 600000 } });
    const yaml = waitKind.toYaml(parsed as never);
    expect(yaml).toEqual({ wait: { event: "ci_passed", deadline_ms: 600000 } });
  });

  it("round-trips attention", () => {
    const parsed = waitKind.fromYaml({ wait: { attention: "need human review" } });
    const yaml = waitKind.toYaml(parsed as never);
    expect(yaml).toEqual({ wait: { attention: "need human review" } });
  });
});
