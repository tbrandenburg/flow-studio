import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const schema = z.object({
  command: z.string().min(1),
});

export const commandKind: NodeKind = {
  id: "command",
  badge: "CMD",
  description: "Run a named command",
  accentVar: "--color-node-command",
  fields: [{ name: "command", label: "Command", type: "text", required: true }],
  preview: (data) => (typeof data.command === "string" ? data.command : ""),
  toYaml: (data) => ({ command: data.command as string }),
  fromYaml: (raw) => {
    if (typeof raw.command !== "string") return null;
    return { kind: "command", label: "Command", command: raw.command };
  },
  schema,
};

export type CommandNodeData = WorkflowNodeData & z.infer<typeof schema>;
