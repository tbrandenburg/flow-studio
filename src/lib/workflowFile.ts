import type { Edge } from "@xyflow/react";
import { graphToDefinition, type WorkflowMeta } from "../workflow/serialize";
import { layoutWithDagre } from "../workflow/layout";
import { toYaml, fromYaml } from "../workflow/yaml";
import { definitionToGraph } from "../workflow/serialize";
import type { WorkflowFlowNode } from "../workflow/types";

export function workflowToYamlText(
  nodes: readonly WorkflowFlowNode[],
  edges: readonly Edge[],
  meta: WorkflowMeta,
): string {
  return toYaml(graphToDefinition(nodes, edges, meta));
}

/** Triggers a browser download of the given YAML text as a `.yaml` file. */
export function downloadYaml(text: string, filename: string): void {
  const blob = new Blob([text], { type: "application/x-yaml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".yaml") ? filename : `${filename}.yaml`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export interface ImportedWorkflow {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
  name: string;
  description: string;
  // Unmodeled workflow-level fields (sandbox, tags, ...) captured from the
  // imported YAML so a subsequent export re-emits them unchanged. See
  // `WorkflowMeta.extra` in serialize.ts.
  extra: Record<string, unknown>;
}

/**
 * Parses YAML text into a graph, applying Dagre layout since imported
 * definitions carry no positions.
 */
export function parseWorkflowYaml(text: string): ImportedWorkflow {
  const def = fromYaml(text);
  const { nodes, edges, extra } = definitionToGraph(def);
  return {
    nodes: layoutWithDagre(nodes, edges),
    edges,
    name: def.name,
    description: def.description ?? "",
    extra,
  };
}
