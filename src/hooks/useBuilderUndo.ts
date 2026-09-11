import { useCallback, useRef, useState } from "react";
import type { Edge } from "@xyflow/react";
import type { WorkflowFlowNode } from "../workflow/types";

export interface BuilderSnapshot {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
}

export interface UseBuilderUndoResult {
  /**
   * Pushes the given nodes/edges as a new snapshot onto the undo stack.
   *
   * CONTRACT: the caller (App.tsx) is responsible for invoking this BEFORE
   * performing a mutation (add/delete/duplicate/drag-start), passing the
   * state as it is right before the mutation. This hook has no way of
   * knowing when a "logical" mutation begins or ends, so it never pushes
   * snapshots on its own. Pushing a new snapshot always clears the redo
   * stack ("redo truncation").
   */
  pushSnapshot: (nodes: WorkflowFlowNode[], edges: Edge[]) => void;
  /** Restores the previous snapshot. `currentNodes`/`currentEdges` are the
   * live state being navigated away from, saved so `redo` can return to it. */
  undo: (currentNodes: WorkflowFlowNode[], currentEdges: Edge[]) => BuilderSnapshot | null;
  /** Restores the snapshot that was last undone away from. */
  redo: (currentNodes: WorkflowFlowNode[], currentEdges: Edge[]) => BuilderSnapshot | null;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_ENTRIES = 100;

function clone(nodes: WorkflowFlowNode[], edges: Edge[]): BuilderSnapshot {
  return { nodes: structuredClone(nodes), edges: structuredClone(edges) };
}

/**
 * Snapshot-stack undo/redo for the workflow builder canvas.
 *
 * Implemented as two stacks (undo/redo), the standard editor pattern: undoing
 * pops the last recorded checkpoint and pushes the state being left behind
 * onto the redo stack; redoing does the reverse. All snapshots are
 * deep-cloned via structuredClone so later mutations of live React Flow
 * state never bleed into stored history.
 */
export function useBuilderUndo(): UseBuilderUndoResult {
  const undoStackRef = useRef<BuilderSnapshot[]>([]);
  const redoStackRef = useRef<BuilderSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const pushSnapshot = useCallback(
    (nodes: WorkflowFlowNode[], edges: Edge[]) => {
      const stack = undoStackRef.current;
      stack.push(clone(nodes, edges));
      if (stack.length > MAX_ENTRIES) stack.shift();
      redoStackRef.current = [];
      syncFlags();
    },
    [syncFlags],
  );

  const undo = useCallback(
    (currentNodes: WorkflowFlowNode[], currentEdges: Edge[]): BuilderSnapshot | null => {
      const target = undoStackRef.current.pop();
      if (!target) return null;
      redoStackRef.current.push(clone(currentNodes, currentEdges));
      syncFlags();
      return target;
    },
    [syncFlags],
  );

  const redo = useCallback(
    (currentNodes: WorkflowFlowNode[], currentEdges: Edge[]): BuilderSnapshot | null => {
      const target = redoStackRef.current.pop();
      if (!target) return null;
      undoStackRef.current.push(clone(currentNodes, currentEdges));
      syncFlags();
      return target;
    },
    [syncFlags],
  );

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}
