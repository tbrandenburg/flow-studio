import type { Node } from "@xyflow/react";

export interface WorkflowNodeData {
  id: string;
  kind: string;
  label: string;
  when?: string;
  trigger_rule?: "all_success" | "all_done" | "any_success";
  [key: string]: unknown;
}

export type WorkflowFlowNode = Node<WorkflowNodeData>;
