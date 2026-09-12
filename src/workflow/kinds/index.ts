import { approvalKind } from "./approval";
import { bashKind } from "./bash";
import { commandKind } from "./command";
import { loopKind } from "./loop";
import { promptKind } from "./prompt";
import { unknownKind } from "./unknown";
import { waitKind } from "./wait";
import type { NodeKind } from "./types";

export type { FieldSpec, NodeKind } from "./types";
export type { BashNodeData } from "./bash";
export type { CommandNodeData } from "./command";
export type { LoopNodeData } from "./loop";
export type { ApprovalNodeData } from "./approval";
export type { WaitNodeData } from "./wait";
export type { PromptNodeData } from "./prompt";
export type { UnknownNodeData } from "./unknown";

// Registry order matters: fromYaml is tried in this order when sniffing a
// node's kind from its raw YAML shape. `prompt` has no discriminator key
// of its own beyond the generic `prompt: string`, so it must stay second
// to last. `unknown` always matches any raw node and is the final,
// catch-all fallback so an unsupported kind never blocks import — it must
// stay last.
export const NODE_KINDS: readonly NodeKind[] = [
  bashKind,
  commandKind,
  loopKind,
  approvalKind,
  waitKind,
  promptKind,
  unknownKind,
];

export function getKind(id: string): NodeKind {
  const kind = NODE_KINDS.find((candidate) => candidate.id === id);
  if (!kind) throw new Error(`Unknown node kind: ${id}`);
  return kind;
}
