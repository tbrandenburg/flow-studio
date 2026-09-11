import { useCallback, useMemo, useState } from "react";
import {
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
} from "@xyflow/react";

import { useDnD } from "../dnd-context";
import { layoutWithDagre } from "../workflow/layout";
import { useNodeSelection } from "./useNodeSelection";
import { useBuilderUndo } from "./useBuilderUndo";
import { useBuilderKeyboard, type BuilderActions } from "./useBuilderKeyboard";
import { useBuilderValidation } from "./useBuilderValidation";
import { useWorkflowMutations } from "./useWorkflowMutations";
import { useWorkflowFileActions } from "./useWorkflowFileActions";
import { useAutosave } from "./useAutosave";
import { useDirtyChangeTracking } from "./useDirtyChangeTracking";
import { restoreInitialState } from "../lib/restoreWorkflow";
import { workflowToYamlText } from "../lib/workflowFile";
import type { YamlViewMode } from "../components/YamlCodeView";
import type { ValidationIssue } from "../workflow/validate";
import type { WorkflowFlowNode } from "../workflow/types";

/**
 * Owns the workflow's data model: nodes/edges state, selection, validation,
 * undo/redo, autosave/persistence, and the node/edge mutation handlers.
 * Deliberately excludes pane-level UI interaction state (quick-add,
 * context menu popovers) which lives in useWorkflowCanvas alongside the
 * component's render wiring.
 */
export function useWorkflowState() {
  const [restored] = useState(() => restoreInitialState());
  const [nodes, setNodes, onNodesChangeBase] = useNodesState(restored.nodes);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState(restored.edges);
  const [workflowName, setWorkflowName] = useState(restored.name);
  const [workflowDescription, setWorkflowDescription] = useState(restored.description);
  const [yamlViewMode, setYamlViewMode] = useState<YamlViewMode>("hidden");
  const [importError, setImportError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
  // snapshot; see useDirtyChangeTracking for the exact semantics.
  const { onNodesChange, onEdgesChange } = useDirtyChangeTracking({
    nodes,
    edges,
    pushSnapshot,
    markDirty,
    onNodesChangeBase,
    onEdgesChangeBase,
  });

  const onAutoLayout = useCallback(() => {
    setNodes((currentNodes) => layoutWithDagre(currentNodes, edges));
    window.requestAnimationFrame(() => fitView());
  }, [edges, fitView, setNodes]);

  const workflowMeta = useMemo(
    () => ({ name: workflowName, description: workflowDescription || undefined }),
    [workflowName, workflowDescription],
  );

  const yamlText = useMemo(
    () => workflowToYamlText(nodes, edges, workflowMeta),
    [nodes, edges, workflowMeta],
  );

  useAutosave(nodes, edges, workflowMeta);

  const mutations = useWorkflowMutations({
    nodes,
    edges,
    setNodes,
    setEdges,
    pushSnapshot,
    markDirty,
    screenToFlowPosition,
    dndKindId,
    setPaletteOpen,
  });

  const fileActions = useWorkflowFileActions({
    setNodes,
    setEdges,
    markDirty,
    workflowName,
    yamlText,
    setWorkflowName,
    setWorkflowDescription,
    setImportError,
    setHasUnsavedChanges,
  });

  const noop = useCallback(() => {}, []);

  const builderActions: BuilderActions = useMemo(
    () => ({
      undo: onUndo,
      redo: onRedo,
      duplicateSelected: mutations.duplicateSelected,
      fitView: () => fitView(),
      selectAll: mutations.selectAll,
      deleteSelected: mutations.deleteSelected,
      save: noop,
    }),
    [fitView, mutations.deleteSelected, mutations.duplicateSelected, mutations.selectAll, noop, onRedo, onUndo],
  );

  useBuilderKeyboard(builderActions, true);

  return {
    nodes,
    edges,
    setEdges,
    styledNodes,
    onNodesChange,
    onEdgesChange,
    onNodeClick,
    onSelectionPaneClick,
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
    onAutoLayout,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    paletteOpen,
    setPaletteOpen,
    screenToFlowPosition,
    onNew: fileActions.onNew,
    onExport: fileActions.onExport,
    onImportFile: fileActions.onImportFile,
    onQuickAddPick: mutations.onQuickAddPick,
    onDeleteNode: mutations.onDeleteNode,
    onDuplicateNode: mutations.onDuplicateNode,
    onDragOver: mutations.onDragOver,
    onDrop: mutations.onDrop,
  };
}
