import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeTypes,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { WorkflowNode } from "./WorkflowNode";
import { NodeInspector } from "./NodeInspector";
import { QuickAddPicker } from "./QuickAddPicker";
import { NodeContextMenu } from "./NodeContextMenu";
import { Sidebar } from "./Sidebar";
import { ValidationPanel } from "./ValidationPanel";
import { BuilderToolbar } from "./BuilderToolbar";
import { YamlCodeView } from "./YamlCodeView";
import { useWorkflowCanvas } from "../hooks/useWorkflowCanvas";

const NODE_TYPES = { workflowNode: WorkflowNode } satisfies NodeTypes;

export function WorkflowBuilder() {
  const {
    wrapperRef,
    styledNodes,
    styledEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onEdgeDoubleClick,
    onNodeClick,
    onPaneClick,
    onNodeContextMenu,
    onDrop,
    onDragOver,
    selectedNode,
    onFieldChange,
    validationIssues,
    onValidationIssueClick,
    workflowName,
    setWorkflowName,
    workflowDescription,
    setWorkflowDescription,
    yamlViewMode,
    setYamlViewMode,
    yamlText,
    hasUnsavedChanges,
    importError,
    onNew,
    onExport,
    onImportFile,
    onAutoLayout,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    paletteOpen,
    setPaletteOpen,
    quickAdd,
    setQuickAdd,
    onQuickAddPick,
    contextMenu,
    setContextMenu,
    onDeleteNode,
    onDuplicateNode,
  } = useWorkflowCanvas();

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
      <div className="absolute top-2 right-2 z-[5] flex flex-col items-end gap-1.5">
        <BuilderToolbar
          workflowName={workflowName}
          workflowDescription={workflowDescription}
          onNameChange={setWorkflowName}
          onDescriptionChange={setWorkflowDescription}
          yamlViewMode={yamlViewMode}
          onYamlViewModeChange={setYamlViewMode}
          hasUnsavedChanges={hasUnsavedChanges}
          onNew={onNew}
          onExport={onExport}
          onImportFile={onImportFile}
          onAutoLayout={onAutoLayout}
          importError={importError}
        />
        <div className="flex items-center gap-2">
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
        </div>
      </div>
      <div className="flex min-w-0 flex-1">
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
        {yamlViewMode === "split" ? <YamlCodeView mode={yamlViewMode} yaml={yamlText} /> : null}
      </div>
      {yamlViewMode === "full" ? <YamlCodeView mode={yamlViewMode} yaml={yamlText} /> : null}
      {selectedNode ? (
        <NodeInspector node={selectedNode} onFieldChange={onFieldChange} />
      ) : null}
      <ValidationPanel issues={validationIssues} onIssueClick={onValidationIssueClick} />
      {quickAdd ? (
        <QuickAddPicker
          position={quickAdd.screenPosition}
          onPick={(kindId) => {
            onQuickAddPick(kindId, quickAdd.flowPosition);
            setQuickAdd(null);
          }}
          onDismiss={() => setQuickAdd(null)}
        />
      ) : null}
      {contextMenu ? (
        <NodeContextMenu
          position={contextMenu.screenPosition}
          onDelete={() => {
            onDeleteNode(contextMenu.nodeId);
            setContextMenu(null);
          }}
          onDuplicate={() => {
            onDuplicateNode(contextMenu.nodeId);
            setContextMenu(null);
          }}
          onDismiss={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  );
}
