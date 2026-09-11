import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getKind } from "../workflow/kinds";
import type { WorkflowFlowNode } from "../workflow/types";

export function WorkflowNode({ data }: NodeProps<WorkflowFlowNode>) {
  const kind = getKind(data.kind);

  return (
    <div
      className="min-w-[160px] max-w-[240px] rounded-md border border-[#ddd] bg-white shadow-sm"
      style={{ borderTop: `3px solid var(${kind.accentVar})` }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="px-2.5 py-2">
        <div
          className="mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white"
          style={{ backgroundColor: `var(${kind.accentVar})` }}
        >
          {kind.badge}
        </div>
        <div className="truncate text-sm font-medium text-[#222]">
          {data.label || kind.description}
        </div>
        <div className="truncate text-xs text-[#888]">{kind.preview(data)}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
