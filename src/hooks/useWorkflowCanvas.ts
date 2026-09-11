import { useCallback, useMemo, useRef, useState } from "react";
import { addEdge, type Edge, type EdgeMouseHandler, type NodeMouseHandler, type OnConnect } from "@xyflow/react";

import { isDoubleClick, type ClickPoint } from "../workflow/doubleClick";
import { useWorkflowState } from "./useWorkflowState";

interface QuickAddState {
  screenPosition: { x: number; y: number };
  flowPosition: { x: number; y: number };
}

interface ContextMenuState {
  nodeId: string;
  screenPosition: { x: number; y: number };
}

/**
 * Adds pane-level interaction wiring (edge styling/toggling, connect,
 * double-click quick-add, right-click context menu) on top of
 * useWorkflowState's data model. WorkflowBuilder consumes this hook and
 * only renders JSX from the returned values, keeping the component file
 * itself focused on layout/markup.
 */
export function useWorkflowCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const lastPaneClickRef = useRef<ClickPoint | null>(null);

  const state = useWorkflowState();
  const { nodes, edges, setEdges, screenToFlowPosition, onSelectionPaneClick } = state;

  const styledEdges = useMemo(() => {
    const whenByNodeId = new Map(nodes.map((node) => [node.id, node.data.when]));
    return edges.map((edge): Edge => {
      const dashed = Boolean(whenByNodeId.get(edge.target));
      return {
        ...edge,
        type: "smoothstep",
        style: dashed ? { strokeDasharray: "5 5" } : undefined,
      };
    });
  }, [nodes, edges]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((currentEdges) => addEdge(connection, currentEdges)),
    [setEdges],
  );

  const onEdgeDoubleClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      setEdges((currentEdges) =>
        currentEdges.map((currentEdge): Edge =>
          currentEdge.id === edge.id
            ? { ...currentEdge, animated: !currentEdge.animated }
            : currentEdge,
        ),
      );
    },
    [setEdges],
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const click: ClickPoint = { x: event.clientX, y: event.clientY, time: Date.now() };
      if (isDoubleClick(lastPaneClickRef.current, click)) {
        lastPaneClickRef.current = null;
        setQuickAdd({
          screenPosition: { x: click.x, y: click.y },
          flowPosition: screenToFlowPosition({ x: click.x, y: click.y }),
        });
        return;
      }
      lastPaneClickRef.current = click;
      onSelectionPaneClick();
    },
    [onSelectionPaneClick, screenToFlowPosition],
  );

  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({ nodeId: node.id, screenPosition: { x: event.clientX, y: event.clientY } });
  }, []);

  return {
    ...state,
    wrapperRef,
    styledEdges,
    onConnect,
    onEdgeDoubleClick,
    onPaneClick,
    onNodeContextMenu,
    quickAdd,
    setQuickAdd,
    contextMenu,
    setContextMenu,
  };
}
