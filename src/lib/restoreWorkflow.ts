import type { Edge } from "@xyflow/react";

import { layoutWithDagre } from "../workflow/layout";
import { loadFromLocalStorage } from "./persistence";
import { definitionToGraph } from "../workflow/serialize";
import type { WorkflowFlowNode } from "../workflow/types";

export const DEFAULT_WORKFLOW_NAME = "untitled-workflow";

const initialNodes: WorkflowFlowNode[] = [
  {
    id: "node-seed-prompt",
    type: "workflowNode",
    position: { x: 0, y: 0 },
    data: {
      id: "node-seed-prompt",
      kind: "prompt",
      label: "Ask agent",
      prompt: "Summarize the repo",
    },
  },
  {
    id: "node-seed-bash",
    type: "workflowNode",
    position: { x: 0, y: 140 },
    data: {
      id: "node-seed-bash",
      kind: "bash",
      label: "Run tests",
      script: "npm test",
      when: "test",
    },
  },
];

const initialEdges: Edge[] = [
  { id: "node-seed-prompt->node-seed-bash", source: "node-seed-prompt", target: "node-seed-bash" },
];

export interface RestoredState {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
  name: string;
  description: string;
  // See `WorkflowMeta.extra` in serialize.ts.
  extra: Record<string, unknown>;
}

/**
 * Attempts to restore the last-saved workflow from localStorage, laying it
 * out with Dagre once before first paint (definitionToGraph zeroes
 * positions). Falls back to the hardcoded seed graph when nothing valid is
 * stored.
 */
export function restoreInitialState(): RestoredState {
  const def = loadFromLocalStorage();
  if (!def) {
    return {
      nodes: initialNodes,
      edges: initialEdges,
      name: DEFAULT_WORKFLOW_NAME,
      description: "",
      extra: {},
    };
  }
  const { nodes, edges, extra } = definitionToGraph(def);
  return {
    nodes: layoutWithDagre(nodes, edges),
    edges,
    name: def.name,
    description: def.description ?? "",
    extra,
  };
}
