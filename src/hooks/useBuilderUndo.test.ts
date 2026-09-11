import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Edge } from "@xyflow/react";
import { useBuilderUndo, type BuilderSnapshot } from "./useBuilderUndo";
import type { WorkflowFlowNode } from "../workflow/types";

function makeNode(id: string): WorkflowFlowNode {
  return {
    id,
    type: "workflowNode",
    position: { x: 0, y: 0 },
    data: { id, kind: "prompt", label: id },
  };
}

const noEdges: Edge[] = [];

describe("useBuilderUndo", () => {
  it("starts with nothing to undo or redo", () => {
    const { result } = renderHook(() => useBuilderUndo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("undo restores the last pushed snapshot", () => {
    const { result } = renderHook(() => useBuilderUndo());
    const s0: WorkflowFlowNode[] = [makeNode("a")];
    const s1: WorkflowFlowNode[] = [makeNode("a"), makeNode("b")];

    act(() => {
      result.current.pushSnapshot(s0, noEdges);
    });
    expect(result.current.canUndo).toBe(true);

    let restored!: BuilderSnapshot | null;
    act(() => {
      restored = result.current.undo(s1, noEdges);
    });

    expect(restored?.nodes.map((n) => n.id)).toEqual(["a"]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it("redo restores the state that was undone away from", () => {
    const { result } = renderHook(() => useBuilderUndo());
    const s0: WorkflowFlowNode[] = [makeNode("a")];
    const s1: WorkflowFlowNode[] = [makeNode("a"), makeNode("b")];

    act(() => {
      result.current.pushSnapshot(s0, noEdges);
    });
    act(() => {
      result.current.undo(s1, noEdges);
    });

    let redone!: BuilderSnapshot | null;
    act(() => {
      redone = result.current.redo(s0, noEdges);
    });

    expect(redone?.nodes.map((n) => n.id)).toEqual(["a", "b"]);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.canUndo).toBe(true);
  });

  it("truncates redo history when a new snapshot is pushed after an undo", () => {
    const { result } = renderHook(() => useBuilderUndo());
    const s0: WorkflowFlowNode[] = [makeNode("a")];
    const s1: WorkflowFlowNode[] = [makeNode("a"), makeNode("b")];
    const s2: WorkflowFlowNode[] = [makeNode("a"), makeNode("c")];

    act(() => {
      result.current.pushSnapshot(s0, noEdges);
    });
    act(() => {
      result.current.undo(s1, noEdges);
    });
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.pushSnapshot(s0, noEdges);
    });
    expect(result.current.canRedo).toBe(false);

    let restored!: BuilderSnapshot | null;
    act(() => {
      restored = result.current.undo(s2, noEdges);
    });
    expect(restored?.nodes.map((n) => n.id)).toEqual(["a"]);
  });

  it("never returns a snapshot that shares references with the live state passed in", () => {
    const { result } = renderHook(() => useBuilderUndo());
    const s0: WorkflowFlowNode[] = [makeNode("a")];

    act(() => {
      result.current.pushSnapshot(s0, noEdges);
    });

    let restored!: BuilderSnapshot | null;
    act(() => {
      restored = result.current.undo([makeNode("a"), makeNode("b")], noEdges);
    });

    expect(restored?.nodes).not.toBe(s0);
    expect(restored?.nodes[0]).not.toBe(s0[0]);
  });

  it("evicts the oldest snapshot once the cap is reached (FIFO)", () => {
    const { result } = renderHook(() => useBuilderUndo());

    act(() => {
      for (let i = 0; i < 101; i += 1) {
        result.current.pushSnapshot([makeNode(`n${i}`)], noEdges);
      }
    });

    // The oldest entry (n0) should have been evicted; undoing 100 times
    // should exhaust the stack and the last-popped snapshot should be n1,
    // not n0.
    let last!: BuilderSnapshot | null;
    act(() => {
      let current: WorkflowFlowNode[] = [makeNode("live")];
      for (let i = 0; i < 100; i += 1) {
        const popped = result.current.undo(current, noEdges);
        if (popped) {
          last = popped;
          current = popped.nodes;
        }
      }
    });

    expect(result.current.canUndo).toBe(false);
    expect(last?.nodes.map((n) => n.id)).toEqual(["n1"]);
  });
});
