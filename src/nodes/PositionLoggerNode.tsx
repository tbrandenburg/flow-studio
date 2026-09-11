import { Handle, Position, type NodeProps } from "@xyflow/react";

import { EditableLabel } from "./EditableLabel";
import { useEditableLabel } from "./useEditableLabel";
import type { PositionLoggerNode as PositionLoggerNodeType } from "./types";

export function PositionLoggerNode({
  id,
  positionAbsoluteX,
  positionAbsoluteY,
  data,
}: NodeProps<PositionLoggerNodeType>) {
  const editable = useEditableLabel(id, data.label);
  const x = `${Math.round(positionAbsoluteX)}px`;
  const y = `${Math.round(positionAbsoluteY)}px`;

  return (
    <div className="react-flow__node-default">
      <EditableLabel label={data.label} editable={editable} />
      <div>
        {x} {y}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
