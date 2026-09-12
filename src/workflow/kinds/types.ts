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
      // When set, the textarea renders the value as a best-effort read-only
      // preview (e.g. JSON) and does not call `onChange` on edit. Used for
      // data shapes (like `loop_group.nodes`) that are structurally too
      // complex for a two-way text editor (see issue #17).
      readOnly?: boolean;
    }
  | { name: string; label: string; type: "number"; required?: boolean; min?: number; max?: number }
  | {
      name: string;
      label: string;
      type: "select";
      required?: boolean;
      options: readonly string[];
    }
  | { name: string; label: string; type: "stringList"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "boolean"; required?: boolean }
  | { name: string; label: string; type: "record"; required?: boolean; placeholder?: string };

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
