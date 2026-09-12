import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const ISOLATIONS = ["inherit", "worktree"] as const;

// `fan_out` is a structured config in Archon's schema (items/as/max_parallel/
// join), but building a nested-object FieldSpec for it isn't worth the
// complexity here (see issue #23 scope note). We preserve whatever shape was
// present in the source YAML losslessly instead of editing it in the UI.
const schema = z.object({
  workflow: z.string().min(1),
  input: z.string().optional(),
  with: z.record(z.string(), z.unknown()).optional(),
  isolation: z.enum(ISOLATIONS).optional(),
  fan_out: z.unknown().optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const workflowKind: NodeKind = {
  id: "workflow",
  badge: "WORKFLOW",
  description: "Start another workflow as a governed child run",
  accentVar: "--color-node-workflow",
  // `fan_out` remains UI-less and round-trips losslessly (see comment above).
  fields: [
    { name: "workflow", label: "Workflow", type: "text", required: true },
    { name: "input", label: "Input", type: "textarea" },
    { name: "with", label: "With", type: "record" },
    { name: "isolation", label: "Isolation", type: "select", options: ISOLATIONS },
  ],
  preview: (data) => (typeof data.workflow === "string" ? data.workflow : ""),
  toYaml: (data) => ({
    workflow: data.workflow as string,
    ...(data.input !== undefined && data.input !== "" ? { input: data.input } : {}),
    ...(isPlainObject(data.with) ? { with: data.with } : {}),
    ...(data.isolation ? { isolation: data.isolation } : {}),
    ...(data.fan_out !== undefined ? { fan_out: data.fan_out } : {}),
  }),
  fromYaml: (raw) => {
    if (typeof raw.workflow !== "string") return null;
    return {
      kind: "workflow",
      label: "Workflow",
      workflow: raw.workflow,
      input: typeof raw.input === "string" ? raw.input : undefined,
      with: isPlainObject(raw.with) ? raw.with : undefined,
      isolation: raw.isolation as (typeof ISOLATIONS)[number] | undefined,
      fan_out: raw.fan_out,
    };
  },
  schema,
};

export type WorkflowKindNodeData = WorkflowNodeData & z.infer<typeof schema>;
