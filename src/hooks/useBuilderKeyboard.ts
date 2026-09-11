import { useEffect } from "react";
import { isInputTarget } from "../lib/isInputTarget";

/**
 * Actions available to the builder keyboard shortcut map. Kept as plain
 * callbacks so `handleBuilderKeydown` stays a pure function, testable
 * without any DOM/React rendering.
 *
 * Shortcuts belonging to features not yet implemented (YAML view toggle,
 * validation panel) are intentionally omitted here; they are wired in
 * later milestones (M7/M8). `save` is a required no-op for now (M8 adds
 * persistence) but still needs `preventDefault()` to suppress the
 * browser's native save dialog.
 */
export interface BuilderActions {
  undo: () => void;
  redo: () => void;
  duplicateSelected: () => void;
  fitView: () => void;
  selectAll: () => void;
  deleteSelected: () => void;
  save: () => void;
}

function isModified(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

/**
 * Pure keydown handler for the workflow builder's keyboard shortcuts.
 * Unit-testable directly with a mock KeyboardEvent-like object.
 */
export function handleBuilderKeydown(
  event: KeyboardEvent,
  actions: BuilderActions,
  enabled: boolean,
): void {
  if (!enabled) return;

  const key = event.key.toLowerCase();

  if (isModified(event)) {
    if (key === "z" && event.shiftKey) {
      event.preventDefault();
      actions.redo();
      return;
    }
    if (key === "z") {
      event.preventDefault();
      actions.undo();
      return;
    }
    if (key === "d") {
      event.preventDefault();
      actions.duplicateSelected();
      return;
    }
    if (key === "0") {
      event.preventDefault();
      actions.fitView();
      return;
    }
    if (key === "a") {
      event.preventDefault();
      actions.selectAll();
      return;
    }
    if (key === "s") {
      event.preventDefault();
      actions.save();
      return;
    }
    return;
  }

  if (key === "delete" || key === "backspace") {
    if (isInputTarget(event.target)) return;
    actions.deleteSelected();
    return;
  }

  // Bare single-letter shortcuts must be gated behind the input-target guard
  // so typing into the inspector's fields never triggers a canvas action.
  if (isInputTarget(event.target)) return;

  if (key === "f") {
    actions.fitView();
  }
}

/**
 * Attaches `handleBuilderKeydown` as a window `keydown` listener for the
 * lifetime of the component, re-attaching whenever `actions` or `enabled`
 * change.
 */
export function useBuilderKeyboard(actions: BuilderActions, enabled: boolean): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      handleBuilderKeydown(event, actions, enabled);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions, enabled]);
}
