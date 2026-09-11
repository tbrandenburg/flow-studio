import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const schema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  provider: z.string().optional(),
  context: z.string().optional(),
  output_format: z.string().optional(),
  allowed_tools: z.array(z.string()).optional(),
  denied_tools: z.array(z.string()).optional(),
  mcp: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export const promptKind: NodeKind = {
  id: "prompt",
  badge: "PROMPT",
  description: "Send a prompt to an agent",
  accentVar: "--color-node-prompt",
  fields: [
    { name: "prompt", label: "Prompt", type: "textarea", required: true },
    { name: "model", label: "Model", type: "text" },
    { name: "provider", label: "Provider", type: "text" },
    { name: "context", label: "Context", type: "textarea" },
    { name: "output_format", label: "Output format", type: "text" },
    { name: "allowed_tools", label: "Allowed tools", type: "stringList" },
    { name: "denied_tools", label: "Denied tools", type: "stringList" },
    { name: "mcp", label: "MCP", type: "stringList" },
    { name: "skills", label: "Skills", type: "stringList" },
  ],
  preview: (data) => (typeof data.prompt === "string" ? data.prompt.split("\n")[0] : ""),
  toYaml: (data) => ({
    prompt: data.prompt as string,
    ...(data.model !== undefined && data.model !== "" ? { model: data.model } : {}),
    ...(data.provider !== undefined && data.provider !== "" ? { provider: data.provider } : {}),
    ...(data.context !== undefined && data.context !== "" ? { context: data.context } : {}),
    ...(data.output_format !== undefined && data.output_format !== ""
      ? { output_format: data.output_format }
      : {}),
    ...(isStringArray(data.allowed_tools) && data.allowed_tools.length > 0
      ? { allowed_tools: data.allowed_tools }
      : {}),
    ...(isStringArray(data.denied_tools) && data.denied_tools.length > 0
      ? { denied_tools: data.denied_tools }
      : {}),
    ...(isStringArray(data.mcp) && data.mcp.length > 0 ? { mcp: data.mcp } : {}),
    ...(isStringArray(data.skills) && data.skills.length > 0 ? { skills: data.skills } : {}),
  }),
  fromYaml: (raw) => {
    if (typeof raw.prompt !== "string") return null;
    return {
      kind: "prompt",
      label: "Prompt",
      prompt: raw.prompt,
      model: raw.model as string | undefined,
      provider: raw.provider as string | undefined,
      context: raw.context as string | undefined,
      output_format: raw.output_format as string | undefined,
      allowed_tools: isStringArray(raw.allowed_tools) ? raw.allowed_tools : undefined,
      denied_tools: isStringArray(raw.denied_tools) ? raw.denied_tools : undefined,
      mcp: isStringArray(raw.mcp) ? raw.mcp : undefined,
      skills: isStringArray(raw.skills) ? raw.skills : undefined,
    };
  },
  schema,
};

export type PromptNodeData = WorkflowNodeData & z.infer<typeof schema>;
