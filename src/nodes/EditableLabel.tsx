import type { useEditableLabel } from "./useEditableLabel";

interface EditableLabelProps {
  label: string;
  editable: ReturnType<typeof useEditableLabel>;
}

/**
 * Renders a node label as plain text, or as an auto-focused multiline
 * textarea while `editable.editing` is true. Double-click the label to
 * start editing.
 */
export function EditableLabel({ label, editable }: EditableLabelProps) {
  const { editing, draft, setDraft, textareaRef, startEditing, commitEditing, onKeyDown } =
    editable;

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        className="node-label-editor nodrag"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commitEditing}
        rows={2}
      />
    );
  }

  return (
    label && (
      <div className="node-label" onDoubleClick={startEditing} title="Double-click to edit">
        {label}
      </div>
    )
  );
}
