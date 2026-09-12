import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

// Note: `until`/`until_bash`/`until_field`/`fresh_context`/`gate_message`/`interactive`
// are nested under the `loop:` key (same as `command`/`prompt`/`max_iterations`), since
// they describe the loop's exit condition/behavior. `allowed_tools`/`effort`/
// `idle_timeout`/`model`/`output_format`/`output_type` are node-level siblings of `loop:`
// (same level as `depends_on`/`when`), following the same convention `prompt.ts` uses for
// its own top-level agent-execution fields.
const schema = z.object({
  command: z.string().optional(),
  prompt: z.string().optional(),
  max_iterations: z.number().optional(),
  until: z.string().optional(),
  until_bash: z.string().optional(),
  until_field: z.string().optional(),
  fresh_context: z.boolean().optional(),
  gate_message: z.string().optional(),
  interactive: z.boolean().optional(),
  allowed_tools: z.array(z.string()).optional(),
  effort: z.string().optional(),
  idle_timeout: z.number().optional(),
  model: z.string().optional(),
  output_format: z.string().optional(),
  output_type: z.string().optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export const loopKind: NodeKind = {
  id: "loop",
  badge: "LOOP",
  description: "Repeat until a condition is met",
  accentVar: "--color-node-loop",
  fields: [
    { name: "command", label: "Command", type: "text" },
    { name: "prompt", label: "Prompt", type: "textarea" },
    { name: "max_iterations", label: "Max iterations", type: "number", min: 0 },
    { name: "until", label: "Until", type: "text" },
    { name: "until_bash", label: "Until bash", type: "text" },
    { name: "until_field", label: "Until field", type: "text" },
    { name: "gate_message", label: "Gate message", type: "text" },
    { name: "fresh_context", label: "Fresh context", type: "select", options: ["true", "false"] },
    { name: "interactive", label: "Interactive", type: "select", options: ["true", "false"] },
    { name: "allowed_tools", label: "Allowed tools", type: "stringList" },
    { name: "effort", label: "Effort", type: "text" },
    { name: "idle_timeout", label: "Idle timeout", type: "number", min: 0 },
    { name: "model", label: "Model", type: "text" },
    { name: "output_format", label: "Output format", type: "text" },
    { name: "output_type", label: "Output type", type: "text" },
  ],
  preview: (data) => (typeof data.command === "string" ? data.command : "loop"),
  toYaml: (data) => ({
    loop: {
      ...(data.command !== undefined && data.command !== "" ? { command: data.command } : {}),
      ...(data.prompt !== undefined && data.prompt !== "" ? { prompt: data.prompt } : {}),
      ...(data.max_iterations !== undefined && data.max_iterations !== null
        ? { max_iterations: Number(data.max_iterations) }
        : {}),
      ...(data.until !== undefined && data.until !== "" ? { until: data.until } : {}),
      ...(data.until_bash !== undefined && data.until_bash !== ""
        ? { until_bash: data.until_bash }
        : {}),
      ...(data.until_field !== undefined && data.until_field !== ""
        ? { until_field: data.until_field }
        : {}),
      ...(data.gate_message !== undefined && data.gate_message !== ""
        ? { gate_message: data.gate_message }
        : {}),
      ...(toBoolean(data.fresh_context) !== undefined
        ? { fresh_context: toBoolean(data.fresh_context) }
        : {}),
      ...(toBoolean(data.interactive) !== undefined
        ? { interactive: toBoolean(data.interactive) }
        : {}),
    },
    ...(isStringArray(data.allowed_tools) && data.allowed_tools.length > 0
      ? { allowed_tools: data.allowed_tools }
      : {}),
    ...(data.effort !== undefined && data.effort !== "" ? { effort: data.effort } : {}),
    ...(data.idle_timeout !== undefined && data.idle_timeout !== null
      ? { idle_timeout: Number(data.idle_timeout) }
      : {}),
    ...(data.model !== undefined && data.model !== "" ? { model: data.model } : {}),
    ...(data.output_format !== undefined && data.output_format !== ""
      ? { output_format: data.output_format }
      : {}),
    ...(data.output_type !== undefined && data.output_type !== ""
      ? { output_type: data.output_type }
      : {}),
  }),
  fromYaml: (raw) => {
    if (!isPlainObject(raw.loop)) return null;
    const loop = raw.loop;
    return {
      kind: "loop",
      label: "Loop",
      command: loop.command as string | undefined,
      prompt: loop.prompt as string | undefined,
      max_iterations: loop.max_iterations as number | undefined,
      until: loop.until as string | undefined,
      until_bash: loop.until_bash as string | undefined,
      until_field: loop.until_field as string | undefined,
      gate_message: loop.gate_message as string | undefined,
      fresh_context: toBoolean(loop.fresh_context),
      interactive: toBoolean(loop.interactive),
      allowed_tools: isStringArray(raw.allowed_tools) ? raw.allowed_tools : undefined,
      effort: raw.effort as string | undefined,
      idle_timeout: raw.idle_timeout as number | undefined,
      model: raw.model as string | undefined,
      output_format: raw.output_format as string | undefined,
      output_type: raw.output_type as string | undefined,
    };
  },
  schema,
};

export type LoopNodeData = WorkflowNodeData & z.infer<typeof schema>;
