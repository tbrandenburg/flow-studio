import { describe, expect, it } from "vitest";
import { commandKind } from "./command";

describe("commandKind.fromYaml", () => {
  it("parses a minimal command node (regression: bare command still works)", () => {
    const result = commandKind.fromYaml({ command: "deploy" });
    expect(result).toEqual({
      kind: "command",
      label: "Command",
      command: "deploy",
      model: undefined,
      provider: undefined,
      context: undefined,
      output_format: undefined,
      allowed_tools: undefined,
      denied_tools: undefined,
      mcp: undefined,
      skills: undefined,
      agents: undefined,
      effort: undefined,
      hooks: undefined,
      idle_timeout: undefined,
      retry: undefined,
      with: undefined,
    });
  });

  it("parses the full aiOnly field set plus with", () => {
    const result = commandKind.fromYaml({
      command: "deploy",
      model: "gpt-5",
      provider: "openai",
      context: "ctx",
      output_format: { type: "object" },
      allowed_tools: ["bash"],
      denied_tools: ["write"],
      mcp: "server",
      skills: ["skill-a"],
      agents: ["agent-a"],
      effort: "high",
      hooks: { pre_tool_use: [{ matcher: "*" }] },
      idle_timeout: 30,
      retry: { max_attempts: 3, delay_ms: 2000, on_error: "transient" },
      with: { input: "value" },
    });
    expect(result).toMatchObject({
      command: "deploy",
      model: "gpt-5",
      provider: "openai",
      context: "ctx",
      output_format: { type: "object" },
      allowed_tools: ["bash"],
      denied_tools: ["write"],
      mcp: "server",
      skills: ["skill-a"],
      agents: ["agent-a"],
      effort: "high",
      hooks: { pre_tool_use: [{ matcher: "*" }] },
      idle_timeout: 30,
      retry: { max_attempts: 3, delay_ms: 2000, on_error: "transient" },
      with: { input: "value" },
    });
  });

  it("returns null when command key is missing", () => {
    expect(commandKind.fromYaml({})).toBeNull();
  });

  it("returns null when command is not a string", () => {
    expect(commandKind.fromYaml({ command: 123 })).toBeNull();
  });
});

describe("commandKind.toYaml", () => {
  it("round-trips a minimal command node (regression: bare command still works)", () => {
    const parsed = commandKind.fromYaml({ command: "deploy" });
    expect(parsed).not.toBeNull();
    const yaml = commandKind.toYaml(parsed as never);
    expect(yaml).toEqual({ command: "deploy" });
  });

  it("round-trips the full aiOnly field set plus with", () => {
    const raw = {
      command: "deploy",
      model: "gpt-5",
      provider: "openai",
      context: "ctx",
      output_format: { type: "object" },
      allowed_tools: ["bash"],
      denied_tools: ["write"],
      mcp: "server",
      skills: ["skill-a"],
      agents: ["agent-a"],
      effort: "high",
      hooks: { pre_tool_use: [{ matcher: "*" }] },
      idle_timeout: 30,
      retry: { max_attempts: 3, delay_ms: 2000, on_error: "transient" },
      with: { input: "value" },
    };
    const parsed = commandKind.fromYaml(raw);
    expect(parsed).not.toBeNull();
    const yaml = commandKind.toYaml(parsed as never);
    expect(yaml).toEqual(raw);
  });
});

describe("commandKind fields", () => {
  it("exposes command as required text", () => {
    const field = commandKind.fields.find((f) => f.name === "command");
    expect(field).toMatchObject({ type: "text", required: true });
  });

  it("exposes with and hooks as record fields", () => {
    const withField = commandKind.fields.find((f) => f.name === "with");
    const hooksField = commandKind.fields.find((f) => f.name === "hooks");
    expect(withField).toMatchObject({ type: "record" });
    expect(hooksField).toMatchObject({ type: "record" });
  });
});
