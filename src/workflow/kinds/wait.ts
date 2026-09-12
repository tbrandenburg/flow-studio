import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const schema = z.object({
  duration_ms: z.number().optional(),
  until: z.string().optional(),
  event: z.string().optional(),
  deadline_ms: z.number().optional(),
  attention: z.string().optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export const waitKind: NodeKind = {
  id: "wait",
  badge: "WAIT",
  description: "Pause until a condition is met",
  accentVar: "--color-node-wait",
  fields: [
    { name: "duration_ms", label: "Duration (ms)", type: "number" },
    { name: "until", label: "Until (ISO timestamp)", type: "text" },
    { name: "event", label: "Event", type: "text" },
    { name: "deadline_ms", label: "Deadline (ms)", type: "number" },
    { name: "attention", label: "Attention message", type: "text" },
  ],
  preview: (data) => {
    if (typeof data.duration_ms === "number") return `duration_ms: ${data.duration_ms}`;
    if (typeof data.until === "string" && data.until) return `until: ${data.until}`;
    if (typeof data.event === "string" && data.event) return `event: ${data.event}`;
    if (typeof data.attention === "string" && data.attention) return `attention: ${data.attention}`;
    return "wait";
  },
  toYaml: (data) => {
    if (typeof data.duration_ms === "number") {
      return { wait: { duration_ms: data.duration_ms } };
    }
    if (typeof data.until === "string" && data.until) {
      return { wait: { until: data.until } };
    }
    if (typeof data.event === "string" && data.event) {
      return { wait: { event: data.event, deadline_ms: data.deadline_ms } };
    }
    if (typeof data.attention === "string" && data.attention) {
      return { wait: { attention: data.attention } };
    }
    return { wait: {} };
  },
  fromYaml: (raw) => {
    if (!isPlainObject(raw.wait)) return null;
    const wait = raw.wait;
    if ("duration_ms" in wait) {
      return { kind: "wait", label: "Wait", duration_ms: toNumber(wait.duration_ms) };
    }
    if ("until" in wait) {
      return { kind: "wait", label: "Wait", until: String(wait.until) };
    }
    if ("event" in wait) {
      return {
        kind: "wait",
        label: "Wait",
        event: String(wait.event),
        deadline_ms: toNumber(wait.deadline_ms),
      };
    }
    if ("attention" in wait) {
      return { kind: "wait", label: "Wait", attention: String(wait.attention) };
    }
    return { kind: "wait", label: "Wait" };
  },
  schema,
};

export type WaitNodeData = WorkflowNodeData & z.infer<typeof schema>;
