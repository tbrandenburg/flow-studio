import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const RUNTIMES = ["bun", "uv"] as const;

const schema = z.object({
  script: z.string().min(1),
  runtime: z.enum(RUNTIMES).optional(),
  deps: z.array(z.string()).optional(),
  timeout: z.number().min(0).optional(),
});

export const scriptKind: NodeKind = {
  id: "script",
  badge: "SCRIPT",
  description: "Run an external script file",
  accentVar: "--color-node-script",
  fields: [
    { name: "script", label: "Script path", type: "text", required: true },
    { name: "runtime", label: "Runtime", type: "select", options: RUNTIMES },
    { name: "deps", label: "Dependencies", type: "stringList" },
    { name: "timeout", label: "Timeout (ms)", type: "number", min: 0 },
  ],
  preview: (data) => (typeof data.script === "string" ? data.script : ""),
  toYaml: (data) => ({
    script: data.script as string,
    ...(data.runtime ? { runtime: data.runtime } : {}),
    ...(Array.isArray(data.deps) && data.deps.length > 0 ? { deps: data.deps } : {}),
    ...(data.timeout !== undefined && data.timeout !== null
      ? { timeout: Number(data.timeout) }
      : {}),
  }),
  fromYaml: (raw) => {
    if (typeof raw.script !== "string") return null;
    return {
      kind: "script",
      label: "Script",
      script: raw.script,
      runtime: raw.runtime as (typeof RUNTIMES)[number] | undefined,
      deps: raw.deps as string[] | undefined,
      timeout: raw.timeout as number | undefined,
    };
  },
  schema,
};

export type ScriptNodeData = WorkflowNodeData & z.infer<typeof schema>;
