import { useCallback, useMemo, useState } from "react";
import type { NodeMouseHandler } from "@xyflow/react";
import type { WorkflowFlowNode } from "../workflow/types";

export interface UseNodeSelectionResult {
  selectedNode: WorkflowFlowNode | null;
  onNodeClick: NodeMouseHandler;
  onPaneClick: () => void;
  onFieldChange: (nodeId: string, key: string, value: unknown) => void;
}

export function useNodeSelection(
  nodes: WorkflowFlowNode[],
  setNodes: (updater: (currentNodes: WorkflowFlowNode[]) => WorkflowFlowNode[]) => void,
): UseNodeSelectionResult {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onFieldChange = useCallback(
    (nodeId: string, key: string, value: unknown) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, [key]: value } } : node,
        ),
      );
    },
    [setNodes],
  );

  return { selectedNode, onNodeClick, onPaneClick, onFieldChange };
}
