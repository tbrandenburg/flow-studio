import { describe, expect, it } from "vitest";
import { promptKind } from "./prompt";

describe("promptKind.fromYaml", () => {
  it("returns null when prompt key is missing", () => {
    expect(promptKind.fromYaml({})).toBeNull();
  });

  it("parses new mcp/agents/effort/hooks/idle_timeout/retry fields", () => {
    const result = promptKind.fromYaml({
      prompt: "do it",
      mcp: "./mcp/server.json",
      agents: ["reviewer", "coder"],
      effort: "high",
      hooks: { PreToolUse: [{ matcher: "Bash", response: "allow", timeout: 5000 }] },
      idle_timeout: 60,
      retry: { max_attempts: 3, delay_ms: 5000, on_error: "all" },
    });
    expect(result).toMatchObject({
      mcp: "./mcp/server.json",
      agents: ["reviewer", "coder"],
      effort: "high",
      hooks: { PreToolUse: [{ matcher: "Bash", response: "allow", timeout: 5000 }] },
      idle_timeout: 60,
      retry: { max_attempts: 3, delay_ms: 5000, on_error: "all" },
    });
  });

  it("does not parse an agent (singular) field", () => {
    const result = promptKind.fromYaml({ prompt: "do it", agent: "reviewer" }) as Record<
      string,
      unknown
    >;
    expect(result).not.toHaveProperty("agent");
  });
});

describe("promptKind.toYaml", () => {
  it("round-trips all new fields", () => {
    const raw = {
      prompt: "do it",
      mcp: "./mcp/server.json",
      agents: ["reviewer", "coder"],
      effort: "high",
      hooks: { PreToolUse: [{ matcher: "Bash", response: "allow", timeout: 5000 }] },
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

  it("round-trips a real Archon single-string mcp and structured hooks config (#27)", () => {
    const raw = {
      prompt: "do it",
      mcp: "./mcp/servers/filesystem.json",
      hooks: {
        PreToolUse: [{ matcher: "Bash", response: "deny", timeout: 3000 }],
        SessionStart: [{ matcher: "*", response: "allow" }],
      },
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

  it("does not export an agent (singular) key even if present in data", () => {
    const yaml = promptKind.toYaml({
      id: "n1",
      kind: "prompt",
      label: "Prompt",
      prompt: "do it",
      agent: "reviewer",
    } as never);
    expect(yaml).not.toHaveProperty("agent");
  });
});

describe("promptKind fields", () => {
  it("exposes a record field for hooks", () => {
    const hooksField = promptKind.fields.find((f) => f.name === "hooks");
    expect(hooksField).toMatchObject({ type: "record" });
  });

  it("exposes a text field for mcp", () => {
    const mcpField = promptKind.fields.find((f) => f.name === "mcp");
    expect(mcpField).toMatchObject({ type: "text" });
  });

  it("does not expose an agent (singular) field", () => {
    expect(promptKind.fields.find((f) => f.name === "agent")).toBeUndefined();
  });

  it("does not expose a retry field (UI-less, structured object)", () => {
    expect(promptKind.fields.find((f) => f.name === "retry")).toBeUndefined();
  });
});
