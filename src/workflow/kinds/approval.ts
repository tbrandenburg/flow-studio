import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const schema = z.object({
  // Archon's `approvalConfigSchema` makes `message` required; flow-studio
  // keeps it optional (documented divergence, see issue #33) since
  // tightening it would be a breaking canvas UX change.
  message: z.string().optional(),
  capture_response: z.boolean().optional(),
  // Archon's real `decisions` is a strict array of decision-option objects.
  // Widen to a lossless passthrough array (same precedent as prompt.ts's
  // `hooks`/`retry`) since a dedicated UI is out of scope.
  decisions: z.array(z.unknown()).optional(),
  // Archon's real `on_reject` is a structured object. Widen to a lossless
  // passthrough record, same pattern as include.ts's `with`.
  on_reject: z.record(z.string(), z.unknown()).optional(),
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
      ...(Array.isArray(data.decisions) && data.decisions.length > 0
        ? { decisions: data.decisions }
        : {}),
      ...(isPlainObject(data.on_reject) && Object.keys(data.on_reject).length > 0
        ? { on_reject: data.on_reject }
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
      decisions: Array.isArray(approval.decisions) ? approval.decisions : undefined,
      on_reject: isPlainObject(approval.on_reject) ? approval.on_reject : undefined,
    };
  },
  schema,
};

export type ApprovalNodeData = WorkflowNodeData & z.infer<typeof schema>;
