import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const RUNTIMES = ["bun", "uv"] as const;
const ON_TIMEOUT_VALUES = ["skip"] as const;

// Archon's `scriptExecAuthoringSchema` makes `runtime` required; flow-studio
// keeps it optional (documented divergence, see issue #33) since tightening
// it would be a breaking canvas UX change.
const schema = z.object({
  script: z.string().min(1),
  runtime: z.enum(RUNTIMES).optional(),
  deps: z.array(z.string()).optional(),
  timeout: z.number().min(0).optional(),
  on_timeout: z.literal("skip").optional(),
  // Node-local input bindings, same lossless passthrough pattern as
  // include.ts's `with`.
  with: z.record(z.string(), z.unknown()).optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
    { name: "on_timeout", label: "On timeout", type: "select", options: ON_TIMEOUT_VALUES },
    { name: "with", label: "With", type: "record" },
  ],
  preview: (data) => (typeof data.script === "string" ? data.script : ""),
  toYaml: (data) => ({
    script: data.script as string,
    ...(data.runtime ? { runtime: data.runtime } : {}),
    ...(Array.isArray(data.deps) && data.deps.length > 0 ? { deps: data.deps } : {}),
    ...(data.timeout !== undefined && data.timeout !== null
      ? { timeout: Number(data.timeout) }
      : {}),
    ...(data.on_timeout === "skip" ? { on_timeout: data.on_timeout } : {}),
    ...(isPlainObject(data.with) && Object.keys(data.with).length > 0 ? { with: data.with } : {}),
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
      on_timeout: raw.on_timeout === "skip" ? "skip" : undefined,
      with: isPlainObject(raw.with) ? raw.with : undefined,
    };
  },
  schema,
};

export type ScriptNodeData = WorkflowNodeData & z.infer<typeof schema>;
