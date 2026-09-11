import { useCallback, useRef, useState } from "react";
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
  type OnConnect,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./App.css";

import { initialEdges, edgeTypes } from "./edges";
import { initialNodes, nodeTypes } from "./nodes";
import type { AppNode } from "./nodes/types";
import { DnDProvider, useDnD } from "./dnd-context";
import { Sidebar } from "./components/Sidebar";

let nodeId = 0;
const getNodeId = () => `dnd-node_${nodeId++}`;

function Flow() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  const [dndType] = useDnD();

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
      if (!dndType) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode: AppNode = {
        id: getNodeId(),
        type: dndType === "default" ? undefined : dndType,
        position,
        data: { label: `${dndType} node` },
      } as AppNode;

      setNodes((currentNodes) => currentNodes.concat(newNode));
      setPaletteOpen(false);
    },
    [dndType, screenToFlowPosition, setNodes],
  );

  return (
    <div className="app-layout">
      <button
        className="palette-toggle"
        onClick={() => setPaletteOpen((open) => !open)}
        aria-label="Toggle node palette"
      >
        ☰ Nodes
      </button>
      <Sidebar open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <div className="flow-wrapper" ref={wrapperRef}>
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          edges={edges}
          edgeTypes={edgeTypes}
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
