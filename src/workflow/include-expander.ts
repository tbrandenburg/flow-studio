import type { WorkflowDefinition, WorkflowNode } from "./schema";

// Matches Archon's real `INCLUDE_MAX_DEPTH` constant (packages/workflows/src/include-expander.ts)
// so this pure re-implementation stays behaviorally aligned with the runtime it mirrors.
export const INCLUDE_MAX_DEPTH = 3;

export type WorkflowMap = Map<string, WorkflowDefinition>;

export interface UnresolvedIncludeIssue {
  type: "unresolved";
  nodeId: string;
  include: string;
}

export interface CycleIssue {
  type: "cycle";
  nodeId: string;
  include: string;
  stack: string[];
}

export interface DepthExceededIssue {
  type: "depth-exceeded";
  nodeId: string;
  include: string;
  depth: number;
}

export type ExpandIssue = UnresolvedIncludeIssue | CycleIssue | DepthExceededIssue;

export interface ExpandResult {
  definition: WorkflowDefinition;
  issues: ExpandIssue[];
}

interface ExpandedSubgraph {
  nodes: WorkflowNode[];
  sinkIds: string[];
  primarySinkId: string | undefined;
}

type NodeListResult = { nodes: WorkflowNode[]; issues: ExpandIssue[] };

function isIncludeNode(node: WorkflowNode): boolean {
  return typeof (node as Record<string, unknown>).include === "string";
}

function hasFanOut(node: WorkflowNode): boolean {
  return (node as Record<string, unknown>).fan_out !== undefined;
}

// Matches `$id.` style output refs so `$id.output`, `$id.result`, etc. all rewrite.
function refPattern(): RegExp {
  return /\$([A-Za-z0-9_-]+)\./g;
}

function deepRewriteStrings(value: unknown, rewrite: (str: string) => string): unknown {
  if (typeof value === "string") return rewrite(value);
  if (Array.isArray(value)) return value.map((item) => deepRewriteStrings(item, rewrite));
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) out[key] = deepRewriteStrings(val, rewrite);
    return out;
  }
  return value;
}

function rewriteOutputRefs(node: WorkflowNode, idMap: Map<string, string>): WorkflowNode {
  if (idMap.size === 0) return node;
  const rewrite = (str: string): string =>
    str.replace(refPattern(), (match, id: string) => (idMap.has(id) ? `$${idMap.get(id)}.` : match));
  return deepRewriteStrings(node, rewrite) as WorkflowNode;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

// Namespaces every internal id `n` to `<includeId>__<n>`, rewriting `depends_on`
// and `$id.output`-style refs so the sub-graph is internally self-consistent.
function namespaceNodes(nodes: WorkflowNode[], includeId: string): WorkflowNode[] {
  const idMap = new Map(nodes.map((node) => [node.id, `${includeId}__${node.id}`]));
  return nodes.map((node) => {
    const namespaced = rewriteOutputRefs(node, idMap);
    const newId = idMap.get(node.id) ?? node.id;
    const dependsOn = node.depends_on?.map((dep) => idMap.get(dep) ?? dep);
    return { ...namespaced, id: newId, ...(dependsOn ? { depends_on: dependsOn } : {}) };
  });
}

// Entry nodes are those with no depends_on pointing at another node inside
// this same (already-namespaced) sub-graph.
function findEntries(nodes: WorkflowNode[]): WorkflowNode[] {
  const internalIds = new Set(nodes.map((n) => n.id));
  return nodes.filter((node) => !(node.depends_on ?? []).some((dep) => internalIds.has(dep)));
}

// Sinks are nodes that nothing else in the sub-graph depends on.
function findSinks(nodes: WorkflowNode[]): WorkflowNode[] {
  const dependedOn = new Set(nodes.flatMap((node) => node.depends_on ?? []));
  return nodes.filter((node) => !dependedOn.has(node.id));
}

// Attaches the include node's own depends_on/when/trigger_rule onto the
// sub-graph's entry nodes so it slots into the parent DAG at the right point.
function attachParentEdge(entry: WorkflowNode, includeNode: WorkflowNode): WorkflowNode {
  const dependsOn = dedupe([...(entry.depends_on ?? []), ...(includeNode.depends_on ?? [])]);
  return {
    ...entry,
    ...(dependsOn.length > 0 ? { depends_on: dependsOn } : {}),
    when: entry.when ?? includeNode.when,
    trigger_rule: entry.trigger_rule ?? includeNode.trigger_rule,
  };
}

function expandIncludeNode(
  node: WorkflowNode,
  workflows: WorkflowMap,
  stack: string[],
  depth: number,
): { subgraph: ExpandedSubgraph; issues: ExpandIssue[] } | { issue: ExpandIssue } {
  const includeName = (node as Record<string, unknown>).include as string;

  if (depth > INCLUDE_MAX_DEPTH) {
    return { issue: { type: "depth-exceeded", nodeId: node.id, include: includeName, depth } };
  }
  if (stack.includes(includeName)) {
    return { issue: { type: "cycle", nodeId: node.id, include: includeName, stack: [...stack] } };
  }
  const target = workflows.get(includeName);
  if (!target) {
    return { issue: { type: "unresolved", nodeId: node.id, include: includeName } };
  }

  const inner = expandNodeList(target.nodes, workflows, [...stack, includeName], depth + 1);
  const namespaced = namespaceNodes(inner.nodes, node.id);
  const entries = findEntries(namespaced);
  const entryIds = new Set(entries.map((n) => n.id));
  const sinks = findSinks(namespaced);

  const finalNodes = namespaced.map((n) => (entryIds.has(n.id) ? attachParentEdge(n, node) : n));

  const returns = (node as Record<string, unknown>).returns;
  const primarySinkId =
    typeof returns === "string" ? `${node.id}__${returns}` : sinks[0]?.id;

  return {
    subgraph: { nodes: finalNodes, sinkIds: sinks.map((n) => n.id), primarySinkId },
    issues: inner.issues,
  };
}

function expandNodeList(
  nodes: WorkflowNode[],
  workflows: WorkflowMap,
  stack: string[],
  depth: number,
): NodeListResult {
  const issues: ExpandIssue[] = [];
  const dependsOnMap = new Map<string, string[]>();
  const outputRefMap = new Map<string, string>();
  const expanded: WorkflowNode[] = [];

  for (const node of nodes) {
    if (isIncludeNode(node) && !hasFanOut(node)) {
      const result = expandIncludeNode(node, workflows, stack, depth);
      if ("issue" in result) {
        issues.push(result.issue);
        expanded.push(node);
        continue;
      }
      issues.push(...result.issues);
      expanded.push(...result.subgraph.nodes);
      dependsOnMap.set(node.id, result.subgraph.sinkIds);
      if (result.subgraph.primarySinkId) outputRefMap.set(node.id, result.subgraph.primarySinkId);
      continue;
    }
    expanded.push(node);
  }

  if (dependsOnMap.size === 0) return { nodes: expanded, issues };

  const finalNodes = expanded.map((node) => {
    const rewrittenDeps = node.depends_on?.flatMap((dep) => dependsOnMap.get(dep) ?? [dep]);
    const withOutputRefs = rewriteOutputRefs(node, outputRefMap);
    return {
      ...withOutputRefs,
      ...(rewrittenDeps ? { depends_on: dedupe(rewrittenDeps) } : {}),
    };
  });

  return { nodes: finalNodes, issues };
}

// Entry point: expands every `include:` node (without `fan_out`) in `definition`
// by inlining the referenced workflow's nodes from `workflows` (keyed by
// workflow name), namespacing ids as `<includeId>__<childId>` and rewiring
// depends_on / `$id.output` refs so the flattened graph is self-consistent.
// Unresolved targets, cycles, and depth overflows are reported as typed
// issues rather than thrown, alongside the best-effort expanded definition.
export function expandIncludes(definition: WorkflowDefinition, workflows: WorkflowMap): ExpandResult {
  const { nodes, issues } = expandNodeList(definition.nodes, workflows, [definition.name], 1);
  return { definition: { ...definition, nodes }, issues };
}
