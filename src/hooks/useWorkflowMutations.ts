import { useCallback } from "react";
import type { Edge } from "@xyflow/react";

import { createFlowNode } from "../workflow/createNode";
import type { WorkflowFlowNode } from "../workflow/types";

export interface UseWorkflowMutationsArgs {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
  setNodes: (updater: (currentNodes: WorkflowFlowNode[]) => WorkflowFlowNode[]) => void;
  setEdges: (updater: (currentEdges: Edge[]) => Edge[]) => void;
  pushSnapshot: (nodes: WorkflowFlowNode[], edges: Edge[]) => void;
  markDirty: () => void;
  screenToFlowPosition: (point: { x: number; y: number }) => { x: number; y: number };
  dndKindId: string | null;
  setPaletteOpen: (open: boolean) => void;
}

export interface UseWorkflowMutationsResult {
  onQuickAddPick: (kindId: string, flowPosition: { x: number; y: number }) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  selectAll: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
}

function duplicateNode(source: WorkflowFlowNode): WorkflowFlowNode {
  const id = `node-${crypto.randomUUID()}`;
  return {
    ...source,
    id,
    selected: false,
    position: { x: source.position.x + 40, y: source.position.y + 40 },
    data: { ...structuredClone(source.data), id },
  };
}

/**
 * Node/edge mutation handlers extracted from the canvas wiring: creation,
 * deletion, duplication, selection bulk-ops, and drag-drop. Every handler
 * that mutates the graph pushes an undo snapshot first and marks the
 * workflow dirty, matching the pre-extraction App.tsx behavior exactly.
 * Whole-document actions (new/export/import) live in useWorkflowFileActions.
 */
export function useWorkflowMutations({
  nodes,
  edges,
  setNodes,
  setEdges,
  pushSnapshot,
  markDirty,
  screenToFlowPosition,
  dndKindId,
  setPaletteOpen,
}: UseWorkflowMutationsArgs): UseWorkflowMutationsResult {
  const onQuickAddPick = useCallback(
    (kindId: string, flowPosition: { x: number; y: number }) => {
      pushSnapshot(nodes, edges);
      const newNode = createFlowNode(kindId, flowPosition);
      setNodes((currentNodes) => currentNodes.concat(newNode));
      markDirty();
    },
    [edges, markDirty, nodes, pushSnapshot, setNodes],
  );

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      pushSnapshot(nodes, edges);
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      markDirty();
    },
    [edges, markDirty, nodes, pushSnapshot, setEdges, setNodes],
  );

  const onDuplicateNode = useCallback(
    (nodeId: string) => {
      pushSnapshot(nodes, edges);
      setNodes((currentNodes) => {
        const source = currentNodes.find((node) => node.id === nodeId);
        if (!source) return currentNodes;
        return currentNodes.concat(duplicateNode(source));
      });
      markDirty();
    },
    [edges, markDirty, nodes, pushSnapshot, setNodes],
  );

  const duplicateSelected = useCallback(() => {
    const selectedIds = nodes.filter((node) => node.selected).map((node) => node.id);
    if (selectedIds.length === 0) return;
    pushSnapshot(nodes, edges);
    setNodes((currentNodes) => {
      const additions = currentNodes
        .filter((node) => selectedIds.includes(node.id))
        .map(duplicateNode);
      return currentNodes.concat(additions);
    });
    markDirty();
  }, [edges, markDirty, nodes, pushSnapshot, setNodes]);

  const deleteSelected = useCallback(() => {
    const selectedNodeIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
    const selectedEdgeIds = new Set(edges.filter((edge) => edge.selected).map((edge) => edge.id));
    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;
    pushSnapshot(nodes, edges);
    setNodes((currentNodes) => currentNodes.filter((node) => !selectedNodeIds.has(node.id)));
    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          !selectedEdgeIds.has(edge.id) &&
          !selectedNodeIds.has(edge.source) &&
          !selectedNodeIds.has(edge.target),
      ),
    );
    markDirty();
  }, [edges, markDirty, nodes, pushSnapshot, setEdges, setNodes]);

  const selectAll = useCallback(() => {
    setNodes((currentNodes) => currentNodes.map((node) => ({ ...node, selected: true })));
    setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, selected: true })));
  }, [setEdges, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kindId = event.dataTransfer.getData("application/reactflow") || dndKindId;
      if (!kindId) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = createFlowNode(kindId, position);

      pushSnapshot(nodes, edges);
      setNodes((currentNodes) => currentNodes.concat(newNode));
      markDirty();
      setPaletteOpen(false);
    },
    [
      dndKindId,
      edges,
      markDirty,
      nodes,
      pushSnapshot,
      screenToFlowPosition,
      setNodes,
      setPaletteOpen,
    ],
  );

  return {
    onQuickAddPick,
    onDeleteNode,
    onDuplicateNode,
    duplicateSelected,
    deleteSelected,
    selectAll,
    onDragOver,
    onDrop,
  };
}
