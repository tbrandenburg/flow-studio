import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const schema = z.object({
  command: z.string().min(1),
  model: z.string().optional(),
  provider: z.string().optional(),
  context: z.string().optional(),
  // Archon's real `output_format` is a JSON-schema-shaped object
  // (z.record(z.string(), z.unknown())), not a free-form string. Widen to a
  // lossless passthrough record (matches prompt.ts's `output_format`) so real
  // structured output-format schemas round-trip without silent data loss.
  output_format: z.record(z.string(), z.unknown()).optional(),
  allowed_tools: z.array(z.string()).optional(),
  denied_tools: z.array(z.string()).optional(),
  mcp: z.string().optional(),
  skills: z.array(z.string()).optional(),
  agents: z.array(z.string()).optional(),
  effort: z.string().optional(),
  // Archon's real `hooks` is a strict object keyed by ~21 SDK hook-event
  // names. Fully vendoring that schema is out of scope (#12); widen to a
  // lossless passthrough record instead (matches prompt.ts's `hooks`).
  hooks: z.record(z.string(), z.unknown()).optional(),
  idle_timeout: z.number().optional(),
  // Matches Archon's `stepRetryConfigSchema` (same as prompt.ts's `retry`).
  // UI-less for now (no structured-object FieldSpec yet), still round-trips
  // losslessly.
  retry: z
    .object({
      max_attempts: z.number().min(1).max(5).optional(),
      delay_ms: z.number().min(1000).max(60000).optional(),
      on_error: z.enum(["transient", "all"]).optional(),
    })
    .optional(),
  // Node-local input bindings, same lossless passthrough pattern as
  // include.ts's/script.ts's `with`.
  with: z.record(z.string(), z.unknown()).optional(),
});

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const commandKind: NodeKind = {
  id: "command",
  badge: "CMD",
  description: "Run a named command",
  accentVar: "--color-node-command",
  fields: [
    { name: "command", label: "Command", type: "text", required: true },
    { name: "model", label: "Model", type: "text" },
    { name: "provider", label: "Provider", type: "text" },
    { name: "context", label: "Context", type: "textarea" },
    { name: "output_format", label: "Output format", type: "record" },
    { name: "allowed_tools", label: "Allowed tools", type: "stringList" },
    { name: "denied_tools", label: "Denied tools", type: "stringList" },
    { name: "mcp", label: "MCP", type: "text" },
    { name: "skills", label: "Skills", type: "stringList" },
    { name: "agents", label: "Agents", type: "stringList" },
    { name: "effort", label: "Effort", type: "text" },
    { name: "hooks", label: "Hooks", type: "record" },
    { name: "idle_timeout", label: "Idle timeout", type: "number", min: 0 },
    { name: "with", label: "With", type: "record" },
  ],
  preview: (data) => (typeof data.command === "string" ? data.command : ""),
  toYaml: (data) => ({
    command: data.command as string,
    ...(data.model !== undefined && data.model !== "" ? { model: data.model } : {}),
    ...(data.provider !== undefined && data.provider !== "" ? { provider: data.provider } : {}),
    ...(data.context !== undefined && data.context !== "" ? { context: data.context } : {}),
    ...(isPlainObject(data.output_format) && Object.keys(data.output_format).length > 0
      ? { output_format: data.output_format }
      : {}),
    ...(isStringArray(data.allowed_tools) && data.allowed_tools.length > 0
      ? { allowed_tools: data.allowed_tools }
      : {}),
    ...(isStringArray(data.denied_tools) && data.denied_tools.length > 0
      ? { denied_tools: data.denied_tools }
      : {}),
    ...(data.mcp !== undefined && data.mcp !== "" ? { mcp: data.mcp } : {}),
    ...(isStringArray(data.skills) && data.skills.length > 0 ? { skills: data.skills } : {}),
    ...(isStringArray(data.agents) && data.agents.length > 0 ? { agents: data.agents } : {}),
    ...(data.effort !== undefined && data.effort !== "" ? { effort: data.effort } : {}),
    ...(isPlainObject(data.hooks) && Object.keys(data.hooks).length > 0
      ? { hooks: data.hooks }
      : {}),
    ...(data.idle_timeout !== undefined && data.idle_timeout !== null
      ? { idle_timeout: Number(data.idle_timeout) }
      : {}),
    ...(data.retry !== undefined && data.retry !== null ? { retry: data.retry } : {}),
    ...(isPlainObject(data.with) && Object.keys(data.with).length > 0 ? { with: data.with } : {}),
  }),
  fromYaml: (raw) => {
    if (typeof raw.command !== "string") return null;
    return {
      kind: "command",
      label: "Command",
      command: raw.command,
      model: raw.model as string | undefined,
      provider: raw.provider as string | undefined,
      context: raw.context as string | undefined,
      output_format: isPlainObject(raw.output_format) ? raw.output_format : undefined,
      allowed_tools: isStringArray(raw.allowed_tools) ? raw.allowed_tools : undefined,
      denied_tools: isStringArray(raw.denied_tools) ? raw.denied_tools : undefined,
      mcp: raw.mcp as string | undefined,
      skills: isStringArray(raw.skills) ? raw.skills : undefined,
      agents: isStringArray(raw.agents) ? raw.agents : undefined,
      effort: raw.effort as string | undefined,
      hooks: isPlainObject(raw.hooks) ? raw.hooks : undefined,
      idle_timeout: raw.idle_timeout as number | undefined,
      retry: raw.retry as
        | { max_attempts?: number; delay_ms?: number; on_error?: string }
        | undefined,
      with: isPlainObject(raw.with) ? raw.with : undefined,
    };
  },
  schema,
};

export type CommandNodeData = WorkflowNodeData & z.infer<typeof schema>;
