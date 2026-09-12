import type { Node } from "@xyflow/react";
import type { TRIGGER_RULES } from "./schema";

export interface WorkflowNodeData {
  id: string;
  kind: string;
  label: string;
  when?: string;
  trigger_rule?: (typeof TRIGGER_RULES)[number];
  [key: string]: unknown;
}

export type WorkflowFlowNode = Node<WorkflowNodeData>;
