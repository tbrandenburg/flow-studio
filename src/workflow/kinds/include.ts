import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

// `fan_out` is documented in real workflows as a simple flag (boolean or
// string) rather than a structured object. We preserve whatever scalar
// shape was present in the source YAML instead of coercing it, since the
// exact semantics are still TBD (see issue #8).
const schema = z.object({
  include: z.string().min(1),
  with: z.record(z.string(), z.unknown()).optional(),
  fan_out: z.union([z.boolean(), z.string()]).optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const includeKind: NodeKind = {
  id: "include",
  badge: "INCLUDE",
  description: "Run a named sub-workflow",
  accentVar: "--color-node-include",
  fields: [{ name: "include", label: "Workflow", type: "text", required: true }],
  preview: (data) => (typeof data.include === "string" ? data.include : ""),
  toYaml: (data) => ({
    include: data.include as string,
    ...(isPlainObject(data.with) ? { with: data.with } : {}),
    ...(data.fan_out !== undefined ? { fan_out: data.fan_out } : {}),
  }),
  fromYaml: (raw) => {
    if (typeof raw.include !== "string") return null;
    return {
      kind: "include",
      label: "Include",
      include: raw.include,
      with: isPlainObject(raw.with) ? raw.with : undefined,
      fan_out: raw.fan_out as boolean | string | undefined,
    };
  },
  schema,
};

export type IncludeNodeData = WorkflowNodeData & z.infer<typeof schema>;
