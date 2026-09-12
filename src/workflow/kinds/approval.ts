import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const schema = z.object({
  message: z.string().optional(),
  capture_response: z.boolean().optional(),
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const approvalKind: NodeKind = {
  id: "approval",
  badge: "APPROVAL",
  description: "Wait for human approval",
  accentVar: "--color-node-approval",
  fields: [
    { name: "message", label: "Message", type: "text" },
    {
      name: "capture_response",
      label: "Capture response",
      type: "boolean",
    },
  ],
  preview: (data) => (typeof data.message === "string" ? data.message : "approval"),
  toYaml: (data) => ({
    approval: {
      ...(data.message !== undefined && data.message !== "" ? { message: data.message } : {}),
      ...(typeof data.capture_response === "boolean"
        ? { capture_response: data.capture_response }
        : {}),
    },
  }),
  fromYaml: (raw) => {
    if (!isPlainObject(raw.approval)) return null;
    const approval = raw.approval;
    return {
      kind: "approval",
      label: "Approval",
      message: approval.message as string | undefined,
      capture_response:
        typeof approval.capture_response === "boolean" ? approval.capture_response : undefined,
    };
  },
  schema,
};

export type ApprovalNodeData = WorkflowNodeData & z.infer<typeof schema>;
