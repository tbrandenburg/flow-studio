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
      // `kind.fromYaml` may supply its own hardcoded fallback label (e.g. "Shell")
      // when the raw YAML has no `label` key. That fallback must never be treated
      // as a user-provided value, or every reload/import would "invent" a label
      // that then gets serialized back out, breaking round-trip identity. Only a
      // label explicitly present in the raw YAML is preserved here; the UI is
      // responsible for falling back to the kind's badge/description for display
      // when `label` is empty.
      return {
        id: raw.id,
        ...result,
        label: typeof raw.label === "string" ? raw.label : "",
      } as WorkflowNodeData;
    }
  }
  throw new Error(`Unable to resolve node kind for node: ${raw.id}`);
}

/**
 * Resolves duplicate node ids in a raw definition's `nodes` array by
 * remapping every occurrence after the first to a unique id (numeric
 * suffix). The first occurrence of any id keeps it unchanged, so
 * `depends_on` references made elsewhere in the YAML continue to resolve to
 * that first occurrence, which is the least-surprising interpretation of an
 * otherwise-ambiguous reference. Returns the final id for each node index
 * (parallel to `def.nodes`).
 */
function remapDuplicateIds(nodes: readonly WorkflowNode[]): string[] {
  const seen = new Set<string>();
  const finalIds: string[] = [];

  for (const raw of nodes) {
    if (!seen.has(raw.id)) {
      seen.add(raw.id);
      finalIds.push(raw.id);
      continue;
    }
    let suffix = 2;
    let candidate = `${raw.id}-${suffix}`;
    while (seen.has(candidate)) {
      suffix += 1;
      candidate = `${raw.id}-${suffix}`;
    }
    seen.add(candidate);
    finalIds.push(candidate);
  }

  return finalIds;
}

export function definitionToGraph(def: WorkflowDefinition): {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
} {
  const finalIds = remapDuplicateIds(def.nodes);

  const nodes: WorkflowFlowNode[] = def.nodes.map((raw, index) => {
    const id = finalIds[index];
    const kindData = resolveKindData(raw);
    const data: WorkflowNodeData = {
      ...kindData,
      id,
      ...(raw.when !== undefined ? { when: raw.when } : {}),
      ...(raw.trigger_rule !== undefined ? { trigger_rule: raw.trigger_rule } : {}),
    };
    return {
      id,
      type: "workflowNode",
      position: { x: 0, y: 0 },
      data,
    };
  });

  // A `depends_on` reference to a duplicated original id is ambiguous; it is
  // resolved to the first occurrence of that id, which is the node that kept
  // the original (unremapped) id.
  const edges: Edge[] = def.nodes.flatMap((raw, index) => {
    const target = finalIds[index];
    return (raw.depends_on ?? []).map((source) => ({
      id: `${source}->${target}`,
      source,
      target,
    }));
  });

  return { nodes, edges };
}
