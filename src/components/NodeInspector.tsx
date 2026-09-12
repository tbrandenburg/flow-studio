import { getKind } from "../workflow/kinds";
import { TRIGGER_RULES } from "../workflow/schema";
import type { WorkflowFlowNode } from "../workflow/types";
import { FieldRenderer } from "./FieldRenderer";

const TRIGGER_RULE_OPTIONS = TRIGGER_RULES;

const inputClass =
  "nodrag w-full rounded border border-border px-2 py-1 text-sm text-text-primary focus:border-border-bright focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-text-secondary";

export interface NodeInspectorProps {
  node: WorkflowFlowNode;
  onFieldChange: (nodeId: string, key: string, value: unknown) => void;
}

export function NodeInspector({ node, onFieldChange }: NodeInspectorProps) {
  const kind = getKind(node.data.kind);
  const data = node.data;

  const setField = (key: string, value: unknown) => {
    onFieldChange(node.id, key, value);
  };

  return (
    <div className="h-full w-72 shrink-0 overflow-y-auto border-l border-border bg-surface-elevated p-3">
      <h2 className="mb-3 text-sm font-semibold text-text-primary">{kind.badge}</h2>

      <div className="mb-3">
        <label className={labelClass}>ID</label>
        <div className="rounded border border-border bg-surface px-2 py-1 text-sm text-text-secondary">
          {data.id}
        </div>
      </div>

      <div className="mb-3">
        <label className={labelClass}>Label</label>
        <input
          className={inputClass}
          type="text"
          value={data.label}
          onChange={(event) => setField("label", event.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className={labelClass}>When</label>
        <input
          className={inputClass}
          type="text"
          value={data.when ?? ""}
          onChange={(event) => setField("when", event.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className={labelClass}>Trigger rule</label>
        <select
          className={inputClass}
          value={data.trigger_rule ?? ""}
          onChange={(event) =>
            setField("trigger_rule", event.target.value === "" ? undefined : event.target.value)
          }
        >
          <option value="">-</option>
          {TRIGGER_RULE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {kind.fields.map((field) => (
        <div className="mb-3" key={field.name}>
          <label className={labelClass}>{field.label}</label>
          <FieldRenderer
            field={field}
            value={data[field.name]}
            onChange={(value) => setField(field.name, value)}
          />
        </div>
      ))}
    </div>
  );
}
