import { useEffect } from "react";
import type { Edge } from "@xyflow/react";

import { saveToLocalStorage } from "../lib/persistence";
import { graphToDefinition } from "../workflow/serialize";
import type { WorkflowFlowNode } from "../workflow/types";

const AUTOSAVE_DEBOUNCE_MS = 300;

/**
 * Debounced autosave: persists the current graph as YAML-backed JSON on
 * every change so a reload restores the last-known state.
 */
export function useAutosave(
  nodes: WorkflowFlowNode[],
  edges: Edge[],
  workflowMeta: { name: string; description?: string },
): void {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveToLocalStorage(graphToDefinition(nodes, edges, workflowMeta));
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [nodes, edges, workflowMeta]);
}
