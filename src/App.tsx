import { useCallback, useMemo, useRef, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeChange,
  type EdgeMouseHandler,
  type NodeChange,
  type NodeMouseHandler,
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { WorkflowNode } from "./components/WorkflowNode";
import { NodeInspector } from "./components/NodeInspector";
import { QuickAddPicker } from "./components/QuickAddPicker";
import { NodeContextMenu } from "./components/NodeContextMenu";
import { DnDProvider, useDnD } from "./dnd-context";
import { Sidebar } from "./components/Sidebar";
import { layoutWithDagre } from "./workflow/layout";
import { createFlowNode } from "./workflow/createNode";
import { isDoubleClick, type ClickPoint } from "./workflow/doubleClick";
import { useNodeSelection } from "./hooks/useNodeSelection";
import { useBuilderUndo } from "./hooks/useBuilderUndo";
import { useBuilderKeyboard, type BuilderActions } from "./hooks/useBuilderKeyboard";
import { useBuilderValidation } from "./hooks/useBuilderValidation";
import { ValidationPanel } from "./components/ValidationPanel";
import type { ValidationIssue } from "./workflow/validate";
import type { WorkflowFlowNode } from "./workflow/types";

const NODE_TYPES = { workflowNode: WorkflowNode } satisfies NodeTypes;

const initialNodes: WorkflowFlowNode[] = [
  {
    id: "node-seed-prompt",
    type: "workflowNode",
    position: { x: 0, y: 0 },
    data: { id: "node-seed-prompt", kind: "prompt", label: "Ask agent", prompt: "Summarize the repo" },
  },
  {
    id: "node-seed-bash",
    type: "workflowNode",
    position: { x: 0, y: 140 },
    data: {
      id: "node-seed-bash",
      kind: "bash",
      label: "Run tests",
      script: "npm test",
      when: "test",
    },
  },
];

const initialEdges: Edge[] = [{ id: "node-seed-prompt->node-seed-bash", source: "node-seed-prompt", target: "node-seed-bash" }];

interface QuickAddState {
  screenPosition: { x: number; y: number };
  flowPosition: { x: number; y: number };
}

interface ContextMenuState {
  nodeId: string;
  screenPosition: { x: number; y: number };
}

function Flow() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState(initialEdges);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastPaneClickRef = useRef<ClickPoint | null>(null);
  const isDraggingRef = useRef(false);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [dndKindId] = useDnD();
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useBuilderUndo();

  const { selectedNode, onNodeClick, onPaneClick: onSelectionPaneClick, onFieldChange } =
    useNodeSelection(nodes, setNodes);

  const validationIssues = useBuilderValidation(nodes, edges);

  const errorNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const issue of validationIssues) {
      if (issue.severity === "error" && issue.nodeId) ids.add(issue.nodeId);
    }
    return ids;
  }, [validationIssues]);

  const styledNodes = useMemo(
    () =>
      nodes.map((node) =>
        errorNodeIds.has(node.id)
          ? { ...node, className: "workflow-node-error" }
          : { ...node, className: undefined },
      ),
    [nodes, errorNodeIds],
  );

  const onValidationIssueClick = useCallback(
    (issue: ValidationIssue) => {
      if (!issue.nodeId) return;
      const node = nodes.find((candidate) => candidate.id === issue.nodeId);
      if (!node) return;
      onNodeClick({} as React.MouseEvent, node);
      void fitView({ nodes: [{ id: node.id }], duration: 300 });
    },
    [fitView, nodes, onNodeClick],
  );

  const markDirty = useCallback(() => setHasUnsavedChanges(true), []);

  const restoreSnapshot = useCallback(
    (snapshot: { nodes: WorkflowFlowNode[]; edges: Edge[] } | null) => {
      if (!snapshot) return;
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
    },
    [setEdges, setNodes],
  );

  const onUndo = useCallback(() => {
    restoreSnapshot(undo(nodes, edges));
  }, [edges, nodes, restoreSnapshot, undo]);

  const onRedo = useCallback(() => {
    restoreSnapshot(redo(nodes, edges));
  }, [edges, nodes, redo, restoreSnapshot]);

  // Only non-"select" changes count as dirty and, for node position changes,
  // only the leading edge of a drag gesture (dragging: true) pushes an undo
  // snapshot; intermediate move events during the same drag must not each
  // produce their own step. "dimensions" changes without `resizing: true`
  // are React Flow's own initial-measurement events (fired once per node on
  // mount) and must not be treated as user edits.
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

  const onAutoLayout = useCallback(() => {
    setNodes((currentNodes) => layoutWithDagre(currentNodes, edges));
    window.requestAnimationFrame(() => fitView());
  }, [edges, fitView, setNodes]);

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

  const onQuickAddPick = useCallback(
    (kindId: string) => {
      if (!quickAdd) return;
      pushSnapshot(nodes, edges);
      const newNode = createFlowNode(kindId, quickAdd.flowPosition);
      setNodes((currentNodes) => currentNodes.concat(newNode));
      markDirty();
      setQuickAdd(null);
    },
    [edges, markDirty, nodes, pushSnapshot, quickAdd, setNodes],
  );

  const onDeleteNode = useCallback(() => {
    if (!contextMenu) return;
    const { nodeId } = contextMenu;
    pushSnapshot(nodes, edges);
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    );
    markDirty();
    setContextMenu(null);
  }, [contextMenu, edges, markDirty, nodes, pushSnapshot, setEdges, setNodes]);

  const onDuplicateNode = useCallback(() => {
    if (!contextMenu) return;
    const { nodeId } = contextMenu;
    pushSnapshot(nodes, edges);
    setNodes((currentNodes) => {
      const source = currentNodes.find((node) => node.id === nodeId);
      if (!source) return currentNodes;
      const id = `node-${crypto.randomUUID()}`;
      const duplicate: WorkflowFlowNode = {
        ...source,
        id,
        selected: false,
        position: { x: source.position.x + 40, y: source.position.y + 40 },
        data: { ...structuredClone(source.data), id },
      };
      return currentNodes.concat(duplicate);
    });
    markDirty();
    setContextMenu(null);
  }, [contextMenu, edges, markDirty, nodes, pushSnapshot, setNodes]);

  const duplicateSelected = useCallback(() => {
    const selectedIds = nodes.filter((node) => node.selected).map((node) => node.id);
    if (selectedIds.length === 0) return;
    pushSnapshot(nodes, edges);
    setNodes((currentNodes) => {
      const additions = currentNodes
        .filter((node) => selectedIds.includes(node.id))
        .map((source): WorkflowFlowNode => {
          const id = `node-${crypto.randomUUID()}`;
          return {
            ...source,
            id,
            selected: false,
            position: { x: source.position.x + 40, y: source.position.y + 40 },
            data: { ...structuredClone(source.data), id },
          };
        });
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

  const noop = useCallback(() => {}, []);

  const builderActions: BuilderActions = useMemo(
    () => ({
      undo: onUndo,
      redo: onRedo,
      duplicateSelected,
      fitView: () => fitView(),
      selectAll,
      deleteSelected,
      save: noop,
    }),
    [deleteSelected, duplicateSelected, fitView, noop, onRedo, onUndo, selectAll],
  );

  useBuilderKeyboard(builderActions, true);


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
    [dndKindId, edges, markDirty, nodes, pushSnapshot, screenToFlowPosition, setNodes],
  );

  return (
    <div className="relative flex h-full w-full">
      <button
        className="hidden absolute top-2 left-2 z-[5] cursor-pointer rounded border border-[#ddd] bg-white px-2.5 py-1.5 max-md:block"
        onClick={() => setPaletteOpen((open) => !open)}
        aria-label="Toggle node palette"
      >
        ☰ Nodes
      </button>
      <Sidebar open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <div className="absolute top-2 right-2 z-[5] flex items-center gap-2">
        {hasUnsavedChanges ? (
          <span className="rounded border border-[#ddd] bg-white px-2.5 py-1.5 text-sm text-[#666]">
            ● Unsaved changes
          </span>
        ) : null}
        <button
          className="cursor-pointer rounded border border-[#ddd] bg-white px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          className="cursor-pointer rounded border border-[#ddd] bg-white px-2.5 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
        >
          Redo
        </button>
        <button
          className="cursor-pointer rounded border border-[#ddd] bg-white px-2.5 py-1.5"
          onClick={onAutoLayout}
        >
          Auto-layout
        </button>
      </div>
      <div className="min-w-0 flex-1" ref={wrapperRef}>
        <ReactFlow
          nodes={styledNodes}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          edges={styledEdges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          onDrop={onDrop}
          onDragOver={onDragOver}
          deleteKeyCode={null}
          fitView
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
      {selectedNode ? (
        <NodeInspector node={selectedNode} onFieldChange={onFieldChange} />
      ) : null}
      <ValidationPanel issues={validationIssues} onIssueClick={onValidationIssueClick} />
      {quickAdd ? (
        <QuickAddPicker
          position={quickAdd.screenPosition}
          onPick={onQuickAddPick}
          onDismiss={() => setQuickAdd(null)}
        />
      ) : null}
      {contextMenu ? (
        <NodeContextMenu
          position={contextMenu.screenPosition}
          onDelete={onDeleteNode}
          onDuplicate={onDuplicateNode}
          onDismiss={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <Flow />
      </DnDProvider>
    </ReactFlowProvider>
  );
}

export default App;
