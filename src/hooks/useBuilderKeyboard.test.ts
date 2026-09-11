import { describe, expect, it, vi } from "vitest";
import { handleBuilderKeydown, type BuilderActions } from "./useBuilderKeyboard";

function makeActions(): BuilderActions {
  return {
    undo: vi.fn(),
    redo: vi.fn(),
    duplicateSelected: vi.fn(),
    fitView: vi.fn(),
    selectAll: vi.fn(),
    deleteSelected: vi.fn(),
    save: vi.fn(),
  };
}

function keyEvent(
  key: string,
  init: Partial<{
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    target: EventTarget;
  }> = {},
): KeyboardEvent {
  const target = init.target ?? document.createElement("div");
  return {
    key,
    ctrlKey: init.ctrlKey ?? false,
    metaKey: init.metaKey ?? false,
    shiftKey: init.shiftKey ?? false,
    target,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent;
}

describe("handleBuilderKeydown", () => {
  it("does nothing when disabled", () => {
    const actions = makeActions();
    handleBuilderKeydown(keyEvent("z", { ctrlKey: true }), actions, false);
    expect(actions.undo).not.toHaveBeenCalled();
  });

  it("Ctrl+Z triggers undo", () => {
    const actions = makeActions();
    const event = keyEvent("z", { ctrlKey: true });
    handleBuilderKeydown(event, actions, true);
    expect(actions.undo).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("Ctrl+Shift+Z triggers redo, not undo", () => {
    const actions = makeActions();
    handleBuilderKeydown(keyEvent("z", { ctrlKey: true, shiftKey: true }), actions, true);
    expect(actions.redo).toHaveBeenCalledOnce();
    expect(actions.undo).not.toHaveBeenCalled();
  });

  it("Cmd+D (metaKey) triggers duplicate and prevents default", () => {
    const actions = makeActions();
    const event = keyEvent("d", { metaKey: true });
    handleBuilderKeydown(event, actions, true);
    expect(actions.duplicateSelected).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("Ctrl+0 triggers fit view", () => {
    const actions = makeActions();
    handleBuilderKeydown(keyEvent("0", { ctrlKey: true }), actions, true);
    expect(actions.fitView).toHaveBeenCalledOnce();
  });

  it("Ctrl+A triggers select all", () => {
    const actions = makeActions();
    handleBuilderKeydown(keyEvent("a", { ctrlKey: true }), actions, true);
    expect(actions.selectAll).toHaveBeenCalledOnce();
  });

  it("Ctrl+S is a no-op but still prevents default", () => {
    const actions = makeActions();
    const event = keyEvent("s", { ctrlKey: true });
    handleBuilderKeydown(event, actions, true);
    expect(actions.save).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("Delete triggers deleteSelected", () => {
    const actions = makeActions();
    handleBuilderKeydown(keyEvent("Delete"), actions, true);
    expect(actions.deleteSelected).toHaveBeenCalledOnce();
  });

  it("Backspace triggers deleteSelected", () => {
    const actions = makeActions();
    handleBuilderKeydown(keyEvent("Backspace"), actions, true);
    expect(actions.deleteSelected).toHaveBeenCalledOnce();
  });

  it("bare 'f' triggers fit view when not focused on an input", () => {
    const actions = makeActions();
    handleBuilderKeydown(keyEvent("f"), actions, true);
    expect(actions.fitView).toHaveBeenCalledOnce();
  });

  it("bare 'f' is suppressed while typing inside a textarea", () => {
    const actions = makeActions();
    const textarea = document.createElement("textarea");
    handleBuilderKeydown(keyEvent("f", { target: textarea }), actions, true);
    expect(actions.fitView).not.toHaveBeenCalled();
  });

  it("Delete is suppressed while typing inside an input", () => {
    const actions = makeActions();
    const input = document.createElement("input");
    handleBuilderKeydown(keyEvent("Delete", { target: input }), actions, true);
    expect(actions.deleteSelected).not.toHaveBeenCalled();
  });

  it("Ctrl+Z still fires while focused inside an input", () => {
    const actions = makeActions();
    const input = document.createElement("input");
    handleBuilderKeydown(keyEvent("z", { ctrlKey: true, target: input }), actions, true);
    expect(actions.undo).toHaveBeenCalledOnce();
  });
});
