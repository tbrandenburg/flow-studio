import { describe, expect, it } from "vitest";
import { loopKind } from "./loop";

describe("loopKind.fromYaml", () => {
  it("returns null when loop key is missing", () => {
    expect(loopKind.fromYaml({})).toBeNull();
  });

  it("parses nested exit-condition fields from loop:", () => {
    const result = loopKind.fromYaml({
      loop: {
        command: "run.sh",
        until: "success",
        until_bash: "test -f done",
        until_field: "status",
        gate_message: "confirm?",
        fresh_context: true,
        interactive: false,
        signal_completes: true,
      },
    });
    expect(result).toMatchObject({
      kind: "loop",
      until: "success",
      until_bash: "test -f done",
      until_field: "status",
      gate_message: "confirm?",
      fresh_context: true,
      interactive: false,
      signal_completes: true,
    });
  });

  it("parses sibling node-level fields", () => {
    const result = loopKind.fromYaml({
      loop: { command: "run.sh" },
      allowed_tools: ["bash", "read"],
      effort: "high",
      idle_timeout: 30,
      model: "gpt-5",
      output_format: "json",
      output_type: "text",
    });
    expect(result).toMatchObject({
      allowed_tools: ["bash", "read"],
      effort: "high",
      idle_timeout: 30,
      model: "gpt-5",
      output_format: "json",
      output_type: "text",
    });
  });
});

describe("loopKind.toYaml", () => {
  it("round-trips all new nested and sibling fields", () => {
    const raw = {
      loop: {
        command: "run.sh",
        until: "success",
        until_bash: "test -f done",
        until_field: "status",
        gate_message: "confirm?",
        fresh_context: true,
        interactive: false,
        signal_completes: true,
      },
      allowed_tools: ["bash"],
      effort: "high",
      idle_timeout: 30,
      model: "gpt-5",
      output_format: "json",
      output_type: "text",
    };
    const parsed = loopKind.fromYaml(raw);
    expect(parsed).not.toBeNull();
    const yaml = loopKind.toYaml({ id: "n1", kind: "loop", label: "Loop", ...parsed } as never);
    expect(yaml).toEqual(raw);
  });
});

describe("loopKind fields", () => {
  it("exposes fresh_context, interactive, and signal_completes as boolean", () => {
    const freshContextField = loopKind.fields.find((f) => f.name === "fresh_context");
    const interactiveField = loopKind.fields.find((f) => f.name === "interactive");
    const signalCompletesField = loopKind.fields.find((f) => f.name === "signal_completes");
    expect(freshContextField).toMatchObject({ type: "boolean" });
    expect(interactiveField).toMatchObject({ type: "boolean" });
    expect(signalCompletesField).toMatchObject({ type: "boolean" });
  });
});
