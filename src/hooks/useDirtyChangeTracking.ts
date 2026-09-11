import { useCallback, useRef } from "react";
import type { Edge, EdgeChange, NodeChange } from "@xyflow/react";

import type { WorkflowFlowNode } from "../workflow/types";

export interface UseDirtyChangeTrackingArgs {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
  pushSnapshot: (nodes: WorkflowFlowNode[], edges: Edge[]) => void;
  markDirty: () => void;
  onNodesChangeBase: (changes: NodeChange<WorkflowFlowNode>[]) => void;
  onEdgesChangeBase: (changes: EdgeChange[]) => void;
}

/**
 * Wraps React Flow's raw onNodesChange/onEdgesChange to mark the workflow
 * dirty and push undo snapshots. Only non-"select" changes count as dirty
 * and, for node position changes, only the leading edge of a drag gesture
 * (dragging: true) pushes an undo snapshot; intermediate move events during
 * the same drag must not each produce their own step. "dimensions" changes
 * without `resizing: true` are React Flow's own initial-measurement events
 * (fired once per node on mount) and must not be treated as user edits.
 */
export function useDirtyChangeTracking({
  nodes,
  edges,
  pushSnapshot,
  markDirty,
  onNodesChangeBase,
  onEdgesChangeBase,
}: UseDirtyChangeTrackingArgs) {
  const isDraggingRef = useRef(false);

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowFlowNode>[]) => {
      for (const change of changes) {
        if (change.type === "select") continue;
        if (change.type === "dimensions" && !change.resizing) continue;
        if (change.type === "position") {
          if (change.dragging && !isDraggingRef.current) {
            isDraggingRef.current = true;
            pushSnapshot(nodes, edges);
          }
          if (change.dragging === false) {
            isDraggingRef.current = false;
          }
        }
        markDirty();
      }
      onNodesChangeBase(changes);
    },
    [edges, markDirty, nodes, onNodesChangeBase, pushSnapshot],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const change of changes) {
        if (change.type === "select") continue;
        markDirty();
      }
      onEdgesChangeBase(changes);
    },
    [markDirty, onEdgesChangeBase],
  );

  return { onNodesChange, onEdgesChange };
}
