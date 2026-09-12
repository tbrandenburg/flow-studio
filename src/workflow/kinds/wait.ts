import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const WAIT_TYPES = ["event", "until", "attention", "duration_ms", "deadline_ms"] as const;

const schema = z.object({
  wait_type: z.enum(WAIT_TYPES).optional(),
  value: z.string().optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const waitKind: NodeKind = {
  id: "wait",
  badge: "WAIT",
  description: "Pause until a condition is met",
  accentVar: "--color-node-wait",
  fields: [
    { name: "wait_type", label: "Wait on", type: "select", options: WAIT_TYPES },
    { name: "value", label: "Value", type: "text" },
  ],
  preview: (data) =>
    typeof data.wait_type === "string"
      ? `${data.wait_type}${data.value ? `: ${data.value}` : ""}`
      : "wait",
  toYaml: (data) => {
    const waitType = data.wait_type as (typeof WAIT_TYPES)[number] | undefined;
    if (!waitType) return { wait: {} };
    return { wait: { [waitType]: data.value ?? "" } };
  },
  fromYaml: (raw) => {
    if (!isPlainObject(raw.wait)) return null;
    const wait = raw.wait;
    const waitType = WAIT_TYPES.find((type) => type in wait);
    if (!waitType) return { kind: "wait", label: "Wait" };
    return {
      kind: "wait",
      label: "Wait",
      wait_type: waitType,
      value: String(wait[waitType]),
    };
  },
  schema,
};

export type WaitNodeData = WorkflowNodeData & z.infer<typeof schema>;
