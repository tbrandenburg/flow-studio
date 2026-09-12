import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const schema = z.object({
  reason: z.string().min(1),
});

export const haltKind: NodeKind = {
  id: "halt",
  badge: "HALT",
  description: "Terminate the workflow run with a reason",
  accentVar: "--color-node-halt",
  fields: [{ name: "reason", label: "Reason", type: "text", required: true }],
  preview: (data) => (typeof data.reason === "string" ? data.reason : ""),
  toYaml: (data) => ({ cancel: data.reason as string }),
  fromYaml: (raw) => {
    if (typeof raw.cancel !== "string") return null;
    return { kind: "halt", label: "Halt", reason: raw.cancel };
  },
  schema,
};

export type HaltNodeData = WorkflowNodeData & z.infer<typeof schema>;
