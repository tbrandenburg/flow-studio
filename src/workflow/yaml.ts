import { parse, stringify } from "yaml";
import { NODE_KINDS } from "./kinds";
import { workflowDefinitionSchema, type WorkflowDefinition } from "./schema";

export class WorkflowYamlError extends Error {}

export function toYaml(def: WorkflowDefinition): string {
  return stringify(def);
}

export function fromYaml(text: string): WorkflowDefinition {
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (cause) {
    throw new WorkflowYamlError(
      `Failed to parse workflow YAML: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }

  const result = workflowDefinitionSchema.safeParse(raw);
  if (!result.success) {
    throw new WorkflowYamlError(`Invalid workflow definition: ${result.error.message}`);
  }

  const def = result.data;
  for (const node of def.nodes) {
    const kind = NODE_KINDS.find((candidate) => candidate.fromYaml(node) !== null);
    if (!kind) {
      throw new WorkflowYamlError(`Unable to resolve node kind for node: ${node.id}`);
    }
    const kindData = kind.fromYaml(node);
    const kindResult = kind.schema.safeParse(kindData);
    if (!kindResult.success) {
      throw new WorkflowYamlError(
        `Invalid ${kind.id} node "${node.id}": ${kindResult.error.message}`,
      );
    }
  }

  return def;
}
