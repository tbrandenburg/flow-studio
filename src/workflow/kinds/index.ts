import { approvalKind } from "./approval";
import { bashKind } from "./bash";
import { commandKind } from "./command";
import { loopKind } from "./loop";
import { promptKind } from "./prompt";
import { waitKind } from "./wait";
import type { NodeKind } from "./types";

export type { FieldSpec, NodeKind } from "./types";
export type { BashNodeData } from "./bash";
export type { CommandNodeData } from "./command";
export type { LoopNodeData } from "./loop";
export type { ApprovalNodeData } from "./approval";
export type { WaitNodeData } from "./wait";
export type { PromptNodeData } from "./prompt";

// Registry order matters: fromYaml is tried in this order when sniffing a
// node's kind from its raw YAML shape. `prompt` has no discriminator key
// of its own beyond the generic `prompt: string`, so it must stay last as
// the fallback kind.
export const NODE_KINDS: readonly NodeKind[] = [
  bashKind,
  commandKind,
  loopKind,
  approvalKind,
  waitKind,
  promptKind,
];

export function getKind(id: string): NodeKind {
  const kind = NODE_KINDS.find((candidate) => candidate.id === id);
  if (!kind) throw new Error(`Unknown node kind: ${id}`);
  return kind;
}
