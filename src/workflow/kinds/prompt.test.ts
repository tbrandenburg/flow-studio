import { describe, expect, it } from "vitest";
import { promptKind } from "./prompt";

describe("promptKind.fromYaml", () => {
  it("returns null when prompt key is missing", () => {
    expect(promptKind.fromYaml({})).toBeNull();
  });

  it("parses new agent/agents/effort/hooks/idle_timeout/retry fields", () => {
    const result = promptKind.fromYaml({
      prompt: "do it",
      agent: "reviewer",
      agents: ["reviewer", "coder"],
      effort: "high",
      hooks: { PreToolUse: "echo pre", PostToolUse: "echo post" },
      idle_timeout: 60,
      retry: { max_attempts: 3, delay_ms: 5000, on_error: "all" },
    });
    expect(result).toMatchObject({
      agent: "reviewer",
      agents: ["reviewer", "coder"],
      effort: "high",
      hooks: { PreToolUse: "echo pre", PostToolUse: "echo post" },
      idle_timeout: 60,
      retry: { max_attempts: 3, delay_ms: 5000, on_error: "all" },
    });
  });
});

describe("promptKind.toYaml", () => {
  it("round-trips all new fields", () => {
    const raw = {
      prompt: "do it",
      agent: "reviewer",
      agents: ["reviewer", "coder"],
      effort: "high",
      hooks: { PreToolUse: "echo pre" },
      idle_timeout: 60,
      retry: { max_attempts: 3, delay_ms: 5000, on_error: "transient" },
    };
    const parsed = promptKind.fromYaml(raw);
    expect(parsed).not.toBeNull();
    const yaml = promptKind.toYaml({
      id: "n1",
      kind: "prompt",
      label: "Prompt",
      ...parsed,
    } as never);
    expect(yaml).toEqual(raw);
  });

  it("round-trips a real Archon structured retry object and passes schema validation (#25)", () => {
    const raw = {
      prompt: "do it",
      retry: { max_attempts: 3, delay_ms: 5000, on_error: "all" },
    };
    const parsed = promptKind.fromYaml(raw);
    expect(parsed).not.toBeNull();
    const validated = promptKind.schema.safeParse(parsed);
    expect(validated.success).toBe(true);
    const yaml = promptKind.toYaml({
      id: "n1",
      kind: "prompt",
      label: "Prompt",
      ...parsed,
    } as never);
    expect(yaml).toEqual(raw);
  });
});

describe("promptKind fields", () => {
  it("exposes a record field for hooks", () => {
    const hooksField = promptKind.fields.find((f) => f.name === "hooks");
    expect(hooksField).toMatchObject({ type: "record" });
  });

  it("does not expose a retry field (UI-less, structured object)", () => {
    expect(promptKind.fields.find((f) => f.name === "retry")).toBeUndefined();
  });
});
