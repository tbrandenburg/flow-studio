import { z } from "zod";

// Sourced from Archon's authoritative schema (packages/workflows/src/schemas/dag-node.ts
// triggerRuleSchema) — do not hand-invent values here; keep in sync with upstream.
export const TRIGGER_RULES = [
  "all_success",
  "one_success",
  "none_failed_min_one_success",
  "all_done",
] as const;

// Kind-specific fields are validated separately (see kinds/*.ts `schema`)
// after `fromYaml` has sniffed which kind a raw node object represents.
// Here we only validate the fields common to every node plus keep the
// per-kind payload as an open record.
export const workflowNodeSchema = z
  .object({
    id: z.string().min(1),
    depends_on: z.array(z.string()).optional(),
    when: z.string().optional(),
    trigger_rule: z.enum(TRIGGER_RULES).optional(),
  })
  .and(z.record(z.string(), z.unknown()));

export const workflowDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  nodes: z.array(workflowNodeSchema),
});

export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
