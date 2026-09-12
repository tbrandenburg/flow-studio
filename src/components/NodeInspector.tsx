import { getKind } from "../workflow/kinds";
import { TRIGGER_RULES } from "../workflow/schema";
import type { WorkflowFlowNode } from "../workflow/types";
import { FieldRenderer } from "./FieldRenderer";

const TRIGGER_RULE_OPTIONS = TRIGGER_RULES;

const inputClass =
  "nodrag w-full rounded border border-[#ddd] px-2 py-1 text-sm text-[#222] focus:border-[#888] focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-[#555]";

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
    <div className="h-full w-72 shrink-0 overflow-y-auto border-l border-[#ddd] bg-white p-3">
      <h2 className="mb-3 text-sm font-semibold text-[#222]">{kind.badge}</h2>

      <div className="mb-3">
        <label className={labelClass}>ID</label>
        <div className="rounded border border-[#eee] bg-[#f7f7f7] px-2 py-1 text-sm text-[#666]">
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
