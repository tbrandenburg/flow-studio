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
  type EdgeMouseHandler,
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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const lastPaneClickRef = useRef<ClickPoint | null>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [dndKindId] = useDnD();

  const { selectedNode, onNodeClick, onPaneClick: onSelectionPaneClick, onFieldChange } =
    useNodeSelection(nodes, setNodes);

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
      const newNode = createFlowNode(kindId, quickAdd.flowPosition);
      setNodes((currentNodes) => currentNodes.concat(newNode));
      setQuickAdd(null);
    },
    [quickAdd, setNodes],
  );

  const onDeleteNode = useCallback(() => {
    if (!contextMenu) return;
    const { nodeId } = contextMenu;
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    );
    setContextMenu(null);
  }, [contextMenu, setEdges, setNodes]);

  const onDuplicateNode = useCallback(() => {
    if (!contextMenu) return;
    const { nodeId } = contextMenu;
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
    setContextMenu(null);
  }, [contextMenu, setNodes]);

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

      setNodes((currentNodes) => currentNodes.concat(newNode));
      setPaletteOpen(false);
    },
    [dndKindId, screenToFlowPosition, setNodes],
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
      <button
        className="absolute top-2 right-2 z-[5] cursor-pointer rounded border border-[#ddd] bg-white px-2.5 py-1.5"
        onClick={onAutoLayout}
      >
        Auto-layout
      </button>
      <div className="min-w-0 flex-1" ref={wrapperRef}>
        <ReactFlow
          nodes={nodes}
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
          deleteKeyCode={["Backspace", "Delete"]}
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
