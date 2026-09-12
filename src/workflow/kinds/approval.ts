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

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
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
      type: "select",
      options: ["true", "false"],
    },
  ],
  preview: (data) => (typeof data.message === "string" ? data.message : "approval"),
  toYaml: (data) => ({
    approval: {
      ...(data.message !== undefined && data.message !== "" ? { message: data.message } : {}),
      ...(toBoolean(data.capture_response) !== undefined
        ? { capture_response: toBoolean(data.capture_response) }
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
      capture_response: toBoolean(approval.capture_response),
    };
  },
  schema,
};

export type ApprovalNodeData = WorkflowNodeData & z.infer<typeof schema>;
