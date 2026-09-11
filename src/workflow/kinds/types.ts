import type { ZodTypeAny } from "zod";
import type { WorkflowNodeData } from "../types";

export type FieldSpec =
  | { name: string; label: string; type: "text"; required?: boolean; placeholder?: string }
  | {
      name: string;
      label: string;
      type: "textarea";
      required?: boolean;
      placeholder?: string;
      mono?: boolean;
    }
  | { name: string; label: string; type: "number"; required?: boolean; min?: number; max?: number }
  | {
      name: string;
      label: string;
      type: "select";
      required?: boolean;
      options: readonly string[];
    }
  | { name: string; label: string; type: "stringList"; required?: boolean; placeholder?: string };

export interface NodeKind {
  id: string;
  badge: string;
  description: string;
  accentVar: string;
  fields: readonly FieldSpec[];
  preview: (data: WorkflowNodeData) => string;
  toYaml: (data: WorkflowNodeData) => Record<string, unknown>;
  fromYaml: (raw: Record<string, unknown>) => Partial<WorkflowNodeData> | null;
  schema: ZodTypeAny;
}
