import { Handle, Position, type NodeProps } from "@xyflow/react";

import { EditableLabel } from "./EditableLabel";
import { useEditableLabel } from "./useEditableLabel";
import type { AppNode } from "./types";

type LabelNodeVariant = "input" | "default" | "output";

const VARIANT_HANDLES: Record<LabelNodeVariant, { source?: Position; target?: Position }> = {
  input: { source: Position.Bottom },
  default: { target: Position.Top, source: Position.Bottom },
  output: { target: Position.Top },
};

/**
 * Drop-in replacement for React Flow's built-in "input" / "default" /
 * "output" node renderers that adds double-click-to-edit label support.
 * The outer node wrapper already carries the `react-flow__node-{type}`
 * class (and its padding/width/border styling) for these built-in type
 * keys, so — mirroring InputNode/DefaultNode/OutputNode in @xyflow/react —
 * we render a fragment here rather than adding another styled wrapper.
 */
export function createLabelNode(variant: LabelNodeVariant) {
  const handles = VARIANT_HANDLES[variant];

  return function LabelNode({ id, data, isConnectable }: NodeProps<AppNode>) {
    const label = "label" in data ? String(data.label ?? "") : "";
    const editable = useEditableLabel(id, label);

    return (
      <>
        {handles.target && (
          <Handle type="target" position={handles.target} isConnectable={isConnectable} />
        )}
        <EditableLabel label={label} editable={editable} />
        {handles.source && (
          <Handle type="source" position={handles.source} isConnectable={isConnectable} />
        )}
      </>
    );
  };
}
