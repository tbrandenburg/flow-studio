import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const schema = z.object({
  command: z.string().optional(),
  prompt: z.string().optional(),
  max_iterations: z.number().optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  ],
  preview: (data) => (typeof data.command === "string" ? data.command : "loop"),
  toYaml: (data) => ({
    loop: {
      ...(data.command !== undefined && data.command !== "" ? { command: data.command } : {}),
      ...(data.prompt !== undefined && data.prompt !== "" ? { prompt: data.prompt } : {}),
      ...(data.max_iterations !== undefined && data.max_iterations !== null
        ? { max_iterations: Number(data.max_iterations) }
        : {}),
    },
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
    };
  },
  schema,
};

export type LoopNodeData = WorkflowNodeData & z.infer<typeof schema>;
