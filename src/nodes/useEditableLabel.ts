import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";

/**
 * Shared double-click-to-edit behavior for node labels.
 *
 * Double-click the label to start editing a multiline textarea (native
 * blinking cursor). Shift+Enter inserts a newline; Enter commits the edit
 * and exits edit mode; blurring the textarea also commits.
 */
export function useEditableLabel(id: string, label: string) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [editing]);

  const startEditing = useCallback(() => {
    setDraft(label);
    setEditing(true);
  }, [label]);

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

  return {
    editing,
    draft,
    setDraft,
    textareaRef,
    startEditing,
    commitEditing,
    onKeyDown,
  };
}
