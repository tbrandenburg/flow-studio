import { useEffect, useMemo, useState } from "react";
import type { Edge } from "@xyflow/react";
import { computeGraphIssues, computeInstantIssues, type ValidationIssue } from "../workflow/validate";
import type { WorkflowFlowNode } from "../workflow/types";

const DEBOUNCE_MS = 300;

/**
 * Combines cheap per-render field validation with debounced O(n+e) graph
 * validation (cycles, self-loops, duplicate ids, dangling edges, orphans).
 * The graph pass is deferred so rapid edits (dragging, typing) don't trigger
 * a full graph walk on every keystroke/frame.
 */
export function useBuilderValidation(
  nodes: readonly WorkflowFlowNode[],
  edges: readonly Edge[],
): ValidationIssue[] {
  const instantIssues = useMemo(() => computeInstantIssues(nodes), [nodes]);
  const [graphIssues, setGraphIssues] = useState<ValidationIssue[]>(() =>
    computeGraphIssues(nodes, edges),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setGraphIssues(computeGraphIssues(nodes, edges));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [nodes, edges]);

  return useMemo(() => [...instantIssues, ...graphIssues], [instantIssues, graphIssues]);
}
