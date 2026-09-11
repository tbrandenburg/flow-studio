import dagre from "@dagrejs/dagre";
import type { Edge } from "@xyflow/react";

import type { WorkflowFlowNode } from "./types";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

/**
 * Computes a top-to-bottom auto-layout for the given nodes/edges using Dagre.
 * Falls back to the original node positions if Dagre throws (e.g. cyclic graph).
 */
export function layoutWithDagre(nodes: WorkflowFlowNode[], edges: Edge[]): WorkflowFlowNode[] {
  try {
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 40 });

    for (const node of nodes) {
      graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
    for (const edge of edges) {
      graph.setEdge(edge.source, edge.target);
    }

    dagre.layout(graph);

    return nodes.map((node): WorkflowFlowNode => {
      const laidOut = graph.node(node.id);
      if (!laidOut) return node;
      return {
        ...node,
        position: {
          x: laidOut.x - NODE_WIDTH / 2,
          y: laidOut.y - NODE_HEIGHT / 2,
        },
      };
    });
  } catch {
    return nodes;
  }
}
