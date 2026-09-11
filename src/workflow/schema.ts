import { z } from "zod";

export const TRIGGER_RULES = ["all_success", "all_done", "any_success"] as const;

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
