import type { Edge } from "@xyflow/react";
import type { WorkflowFlowNode } from "./types";

// Self-loops (source === target) are treated as cycles here: a node
// cannot topologically depend on itself. M7 (validation) reports
// self-loops as their own distinct error category on top of this.
export function hasCycle(nodes: readonly WorkflowFlowNode[], edges: readonly Edge[]): boolean {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const id of nodeIds) {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of edges) {
    if (edge.source === edge.target) return true;
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue = [...nodeIds].filter((id) => inDegree.get(id) === 0);
  let visited = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    visited += 1;
    for (const next of adjacency.get(current) ?? []) {
      const remaining = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  return visited !== nodeIds.size;
}

// BFS layering: layer 0 is every root (in-degree 0), each subsequent layer
// contains nodes whose dependencies are all resolved by earlier layers.
export function computeTopologicalLayers(
  nodes: readonly WorkflowFlowNode[],
  edges: readonly Edge[],
): string[][] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const id of nodeIds) {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    if (edge.source === edge.target) continue;
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const layers: string[][] = [];
  const remainingDegree = new Map(inDegree);
  let frontier = [...nodeIds].filter((id) => remainingDegree.get(id) === 0);
  const placed = new Set<string>();

  while (frontier.length > 0) {
    layers.push(frontier);
    for (const id of frontier) placed.add(id);
    const next: string[] = [];
    for (const id of frontier) {
      for (const target of adjacency.get(id) ?? []) {
        const remaining = (remainingDegree.get(target) ?? 0) - 1;
        remainingDegree.set(target, remaining);
        if (remaining === 0 && !placed.has(target)) next.push(target);
      }
    }
    frontier = next;
  }

  return layers;
}
