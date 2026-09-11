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
  type NodeTypes,
  type OnConnect,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { WorkflowNode } from "./components/WorkflowNode";
import { DnDProvider, useDnD } from "./dnd-context";
import { Sidebar } from "./components/Sidebar";
import { getKind, type FieldSpec } from "./workflow/kinds";
import type { WorkflowFlowNode, WorkflowNodeData } from "./workflow/types";

const NODE_TYPES = { workflowNode: WorkflowNode } satisfies NodeTypes;

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function defaultFieldValue(field: FieldSpec): unknown {
  if (field.type === "stringList") return [];
  if (field.type === "number") return undefined;
  return "";
}

function createNodeData(kindId: string): WorkflowNodeData {
  const kind = getKind(kindId);
  const defaults = Object.fromEntries(
    kind.fields.map((field) => [field.name, defaultFieldValue(field)]),
  );
  return {
    id: kindId,
    kind: kindId,
    label: titleCase(kind.badge),
    ...defaults,
  };
}

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

function Flow() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  const [dndKindId] = useDnD();

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
      const id = `node-${crypto.randomUUID()}`;
      const newNode: WorkflowFlowNode = {
        id,
        type: "workflowNode",
        position,
        data: { ...createNodeData(kindId), id },
      };

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
      <div className="min-w-0 flex-1" ref={wrapperRef}>
        <ReactFlow
          nodes={nodes}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          edges={styledEdges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={onEdgeDoubleClick}
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
