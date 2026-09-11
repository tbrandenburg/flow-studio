import { useCallback, useEffect, useRef, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";

import type { PositionLoggerNode as PositionLoggerNodeType } from "./types";

export function PositionLoggerNode({
  id,
  positionAbsoluteX,
  positionAbsoluteY,
  data,
}: NodeProps<PositionLoggerNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const x = `${Math.round(positionAbsoluteX)}px`;
  const y = `${Math.round(positionAbsoluteY)}px`;

  useEffect(() => {
    if (!editing) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [editing]);

  const startEditing = useCallback(() => {
    setDraft(data.label);
    setEditing(true);
  }, [data.label]);

  const commitEditing = useCallback(() => {
    updateNodeData(id, { label: draft });
    setEditing(false);
  }, [draft, id, updateNodeData]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      commitEditing();
    },
    [commitEditing],
  );

  return (
    <div className="react-flow__node-default">
      {editing ? (
        <textarea
          ref={textareaRef}
          className="node-label-editor nodrag"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commitEditing}
          rows={2}
        />
      ) : (
        data.label && (
          <div onDoubleClick={startEditing} title="Double-click to edit">
            {data.label}
          </div>
        )
      )}
      <div>
        {x} {y}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
