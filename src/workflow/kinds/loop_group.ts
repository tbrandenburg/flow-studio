import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

// `loop_group` wraps a nested array of its own child nodes (a mini sub-DAG),
// unlike `loop` (a single leaf action repeated). Per the decided approach
// (issue #10 / tracking issue #15), we render it as an opaque summary node:
// the nested `nodes` array is stored LOSSLESSLY as raw, unparsed data (same
// spirit as `unknown.ts`'s raw passthrough) rather than validated against
// NODE_KINDS. `until_bash`/`max_iterations`/`fresh_context` reuse the same
// field names/types as `loop.ts`'s exit-condition fields for consistency.
const schema = z.object({
  until_bash: z.string().optional(),
  max_iterations: z.number().optional(),
  fresh_context: z.boolean().optional(),
  nodes: z.array(z.record(z.string(), z.unknown())).optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRawNodeArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((item) => isPlainObject(item));
}

export const loopGroupKind: NodeKind = {
  id: "loop_group",
  badge: "LOOP GROUP",
  description: "Repeat a nested sub-DAG of nodes until a condition is met",
  accentVar: "--color-node-loop-group",
  fields: [
    { name: "until_bash", label: "Until bash", type: "text" },
    { name: "max_iterations", label: "Max iterations", type: "number", min: 0 },
    { name: "fresh_context", label: "Fresh context", type: "boolean" },
    // Read-only, best-effort JSON preview of the nested nodes: this is NOT a
    // full nested-node editor (out of scope, see issue #10/#17). Two-way
    // editing of a nested sub-DAG as JSON text is error-prone, so the field
    // is marked `readOnly` and never writes back to `data.nodes`.
    {
      name: "nodes",
      label: "Nested nodes (JSON, read-only)",
      type: "textarea",
      mono: true,
      readOnly: true,
      defaultValue: [],
    },
  ],
  preview: (data) => {
    const nodes = isRawNodeArray(data.nodes) ? data.nodes : [];
    const countLabel = `${nodes.length} nested node${nodes.length === 1 ? "" : "s"}`;
    const untilBash = typeof data.until_bash === "string" ? data.until_bash : undefined;
    return untilBash ? `${countLabel}, until: ${untilBash}` : countLabel;
  },
  toYaml: (data) => ({
    loop_group: {
      ...(data.until_bash !== undefined && data.until_bash !== ""
        ? { until_bash: data.until_bash }
        : {}),
      ...(data.max_iterations !== undefined && data.max_iterations !== null
        ? { max_iterations: Number(data.max_iterations) }
        : {}),
      ...(typeof data.fresh_context === "boolean" ? { fresh_context: data.fresh_context } : {}),
      ...(isRawNodeArray(data.nodes) ? { nodes: data.nodes } : {}),
    },
  }),
  fromYaml: (raw) => {
    if (!isPlainObject(raw.loop_group)) return null;
    const loopGroup = raw.loop_group;
    return {
      kind: "loop_group",
      label: "Loop group",
      until_bash: loopGroup.until_bash as string | undefined,
      max_iterations: loopGroup.max_iterations as number | undefined,
      fresh_context:
        typeof loopGroup.fresh_context === "boolean" ? loopGroup.fresh_context : undefined,
      nodes: isRawNodeArray(loopGroup.nodes) ? loopGroup.nodes : undefined,
    };
  },
  schema,
};

export type LoopGroupNodeData = WorkflowNodeData & z.infer<typeof schema>;
