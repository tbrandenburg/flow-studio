import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

// `fan_out` in real Archon workflows is a structured object
// ({items, as, max_parallel, join}), not a boolean|string. We accept any
// shape (matching workflow.ts's `fan_out` handling) and round-trip it
// losslessly instead of coercing it, since a dedicated UI is out of scope.
const schema = z.object({
  include: z.string().min(1),
  with: z.record(z.string(), z.unknown()).optional(),
  fan_out: z.unknown().optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const includeKind: NodeKind = {
  id: "include",
  badge: "INCLUDE",
  description: "Run a named sub-workflow",
  accentVar: "--color-node-include",
  // `fan_out` is a structured object in real data; a clean single-type UI
  // field isn't obvious without overengineering a union-type FieldSpec, so
  // it remains UI-less for now (still round-trips losslessly, see issue #17).
  fields: [
    { name: "include", label: "Workflow", type: "text", required: true },
    { name: "with", label: "With", type: "record" },
  ],
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
      fan_out: raw.fan_out,
    };
  },
  schema,
};

export type IncludeNodeData = WorkflowNodeData & z.infer<typeof schema>;
