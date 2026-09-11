import type { Edge } from "@xyflow/react";
import { getKind, NODE_KINDS } from "./kinds";
import type { WorkflowDefinition, WorkflowNode } from "./schema";
import type { WorkflowFlowNode, WorkflowNodeData } from "./types";

export interface WorkflowMeta {
  name: string;
  description?: string;
  provider?: string;
  model?: string;
}

const DEFAULT_META: WorkflowMeta = { name: "workflow" };

function dependsOnFor(nodeId: string, edges: readonly Edge[]): string[] {
  return edges.filter((edge) => edge.target === nodeId).map((edge) => edge.source);
}

export function graphToDefinition(
  nodes: readonly WorkflowFlowNode[],
  edges: readonly Edge[],
  meta: WorkflowMeta = DEFAULT_META,
): WorkflowDefinition {
  return {
    name: meta.name,
    description: meta.description,
    provider: meta.provider,
    model: meta.model,
    nodes: nodes.map((node) => {
      const data = node.data;
      const kind = getKind(data.kind);
      const dependsOn = dependsOnFor(node.id, edges);
      return {
        id: node.id,
        ...(dependsOn.length > 0 ? { depends_on: dependsOn } : {}),
        ...(data.when !== undefined && data.when !== "" ? { when: data.when } : {}),
        ...(data.trigger_rule !== undefined ? { trigger_rule: data.trigger_rule } : {}),
        ...kind.toYaml(data),
      };
    }),
  };
}

function resolveKindData(raw: WorkflowNode): WorkflowNodeData {
  for (const kind of NODE_KINDS) {
    const result = kind.fromYaml(raw);
    if (result) {
      return {
        id: raw.id,
        label: "",
        ...result,
      } as WorkflowNodeData;
    }
  }
  throw new Error(`Unable to resolve node kind for node: ${raw.id}`);
}

export function definitionToGraph(def: WorkflowDefinition): {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
} {
  const nodes: WorkflowFlowNode[] = def.nodes.map((raw) => {
    const kindData = resolveKindData(raw);
    const data: WorkflowNodeData = {
      ...kindData,
      id: raw.id,
      ...(raw.when !== undefined ? { when: raw.when } : {}),
      ...(raw.trigger_rule !== undefined ? { trigger_rule: raw.trigger_rule } : {}),
    };
    return {
      id: raw.id,
      type: data.kind,
      position: { x: 0, y: 0 },
      data,
    };
  });

  const edges: Edge[] = def.nodes.flatMap((raw) =>
    (raw.depends_on ?? []).map((source) => ({
      id: `${source}->${raw.id}`,
      source,
      target: raw.id,
    })),
  );

  return { nodes, edges };
}
