import type { Edge } from "@xyflow/react";
import { getKind } from "./kinds";
import { hasCycle } from "./graph";
import type { WorkflowFlowNode } from "./types";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
}

/**
 * Per-node schema checks: each node kind's zod schema is run against its own
 * data, and every failing required field becomes an issue. Cheap (O(n)) and
 * safe to recompute on every render.
 */
export function computeInstantIssues(nodes: readonly WorkflowFlowNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const node of nodes) {
    const kind = getKind(node.data.kind);
    const result = kind.schema.safeParse(node.data);
    if (result.success) continue;

    for (const fieldIssue of result.error.issues) {
      const field = fieldIssue.path.join(".") || node.data.kind;
      issues.push({
        id: `field:${node.id}:${field}`,
        severity: "error",
        message: `${kind.badge}: ${field} ${fieldIssue.message}`,
        nodeId: node.id,
      });
    }
  }

  return issues;
}

/**
 * Graph-shape checks: cycles, self-loops, duplicate ids, dangling edges, and
 * orphan nodes. O(n + e), recomputed on a debounce in the hook rather than
 * on every render.
 *
 * Orphan definition: in a graph with more than one node, a node with zero
 * incoming AND zero outgoing edges is disconnected from the rest of the
 * workflow and is flagged as an orphan.
 */
export function computeGraphIssues(
  nodes: readonly WorkflowFlowNode[],
  edges: readonly Edge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(nodes.map((node) => node.id));

  const seenIds = new Set<string>();
  for (const node of nodes) {
    if (seenIds.has(node.id)) {
      issues.push({
        id: `duplicate:${node.id}`,
        severity: "error",
        message: `Duplicate node id: ${node.id}`,
        nodeId: node.id,
      });
    }
    seenIds.add(node.id);
  }

  for (const edge of edges) {
    if (edge.source === edge.target) {
      issues.push({
        id: `self-loop:${edge.id}`,
        severity: "error",
        message: `Self-loop: node depends on itself`,
        nodeId: edge.source,
      });
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      issues.push({
        id: `dangling:${edge.id}`,
        severity: "error",
        message: `Dangling edge references a missing node (${edge.source} -> ${edge.target})`,
      });
    }
  }

  if (hasCycle(nodes, edges)) {
    issues.push({
      id: "cycle",
      severity: "error",
      message: "Workflow graph contains a cycle",
    });
  }

  if (nodes.length > 1) {
    const degree = new Map(nodes.map((node) => [node.id, 0]));
    for (const edge of edges) {
      if (edge.source === edge.target) continue;
      if (degree.has(edge.source)) degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      if (degree.has(edge.target)) degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    }
    for (const node of nodes) {
      if (degree.get(node.id) === 0) {
        issues.push({
          id: `orphan:${node.id}`,
          severity: "warning",
          message: "Node is not connected to the rest of the workflow",
          nodeId: node.id,
        });
      }
    }
  }

  return issues;
}
