import { useCallback } from "react";
import type { Edge } from "@xyflow/react";

import { WorkflowYamlError } from "../workflow/yaml";
import { downloadYaml, parseWorkflowYaml } from "../lib/workflowFile";
import { clearLocalStorage } from "../lib/persistence";
import type { WorkflowFlowNode } from "../workflow/types";

const DEFAULT_WORKFLOW_NAME = "untitled-workflow";

export interface UseWorkflowFileActionsArgs {
  setNodes: (updater: (currentNodes: WorkflowFlowNode[]) => WorkflowFlowNode[]) => void;
  setEdges: (updater: (currentEdges: Edge[]) => Edge[]) => void;
  markDirty: () => void;
  workflowName: string;
  yamlText: string;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  setImportError: (message: string | null) => void;
  setHasUnsavedChanges: (dirty: boolean) => void;
}

export interface UseWorkflowFileActionsResult {
  onNew: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
}

/**
 * Whole-workflow file actions (new/export/import) extracted from the node
 * mutation handlers since they operate on the document as a whole rather
 * than individual nodes/edges.
 */
export function useWorkflowFileActions({
  setNodes,
  setEdges,
  markDirty,
  workflowName,
  yamlText,
  setWorkflowName,
  setWorkflowDescription,
  setImportError,
  setHasUnsavedChanges,
}: UseWorkflowFileActionsArgs): UseWorkflowFileActionsResult {
  const onNew = useCallback(() => {
    setNodes(() => []);
    setEdges(() => []);
    setWorkflowName(DEFAULT_WORKFLOW_NAME);
    setWorkflowDescription("");
    setImportError(null);
    clearLocalStorage();
    setHasUnsavedChanges(false);
  }, [setEdges, setHasUnsavedChanges, setImportError, setNodes, setWorkflowDescription, setWorkflowName]);

  const onExport = useCallback(() => {
    downloadYaml(yamlText, workflowName || DEFAULT_WORKFLOW_NAME);
  }, [yamlText, workflowName]);

  const onImportFile = useCallback(
    (file: File) => {
      void file.text().then((text) => {
        try {
          const imported = parseWorkflowYaml(text);
          setNodes(() => imported.nodes);
          setEdges(() => imported.edges);
          setWorkflowName(imported.name);
          setWorkflowDescription(imported.description);
          setImportError(null);
          markDirty();
        } catch (cause) {
          setImportError(
            cause instanceof WorkflowYamlError ? cause.message : "Failed to import workflow file.",
          );
        }
      });
    },
    [markDirty, setEdges, setImportError, setNodes, setWorkflowDescription, setWorkflowName],
  );

  return { onNew, onExport, onImportFile };
}
