import type { Edge } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";

import type { WorkflowFlowNode } from "./types";
import { layoutWithDagre } from "./layout";

function node(id: string, x: number, y: number): WorkflowFlowNode {
  return { id, type: "workflowNode", position: { x, y }, data: { id, kind: "bash", label: id } };
}

function edge(source: string, target: string): Edge {
  return { id: `${source}->${target}`, source, target };
}

describe("layoutWithDagre", () => {
  it("lays out a scrambled linear chain in monotonically increasing rank order", () => {
    const nodes = [node("a", 500, 500), node("b", 0, 0), node("c", 200, -300)];
    const edges = [edge("a", "b"), edge("b", "c")];

    const result = layoutWithDagre(nodes, edges);
    const byId = new Map(result.map((n) => [n.id, n.position]));

    const yA = byId.get("a")?.y ?? 0;
    const yB = byId.get("b")?.y ?? 0;
    const yC = byId.get("c")?.y ?? 0;

    expect(yA).toBeLessThan(yB);
    expect(yB).toBeLessThan(yC);

    const positions = result.map((n) => `${n.position.x},${n.position.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it("does not throw for a graph containing a cycle and returns finite positions", () => {
    const nodes = [node("a", 0, 0), node("b", 0, 0)];
    const edges = [edge("a", "b"), edge("b", "a")];

    expect(() => layoutWithDagre(nodes, edges)).not.toThrow();
    const result = layoutWithDagre(nodes, edges);
    for (const n of result) {
      expect(Number.isFinite(n.position.x)).toBe(true);
      expect(Number.isFinite(n.position.y)).toBe(true);
    }
  });

  it("falls back to the original positions unchanged when dagre throws", async () => {
    const dagreModule = await import("@dagrejs/dagre");
    const layoutSpy = vi.spyOn(dagreModule.default, "layout").mockImplementation(() => {
      throw new Error("simulated dagre failure");
    });

    const nodes = [node("a", 12, 34), node("b", 56, 78)];
    const edges = [edge("a", "b")];

    const result = layoutWithDagre(nodes, edges);
    expect(result).toEqual(nodes);

    layoutSpy.mockRestore();
  });

  it("handles a single node with no edges without crashing", () => {
    const nodes = [node("solo", 999, -999)];
    const result = layoutWithDagre(nodes, []);

    expect(result).toHaveLength(1);
    expect(Number.isFinite(result[0].position.x)).toBe(true);
    expect(Number.isFinite(result[0].position.y)).toBe(true);
  });
});
