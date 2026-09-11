import { getKind, type FieldSpec } from "./kinds";
import type { WorkflowFlowNode, WorkflowNodeData } from "./types";

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

/** Builds default WorkflowNodeData for a given kind. Shared by drag-drop and quick-add. */
export function createNodeData(kindId: string): WorkflowNodeData {
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

/** Builds a full canvas node of the given kind at the given position, with a fresh id. */
export function createFlowNode(
  kindId: string,
  position: { x: number; y: number },
): WorkflowFlowNode {
  const id = `node-${crypto.randomUUID()}`;
  return {
    id,
    type: "workflowNode",
    position,
    data: { ...createNodeData(kindId), id },
  };
}
