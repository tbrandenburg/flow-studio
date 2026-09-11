import type { Edge } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { computeTopologicalLayers, hasCycle } from "./graph";
import type { WorkflowFlowNode } from "./types";

function node(id: string): WorkflowFlowNode {
  return { id, type: "bash", position: { x: 0, y: 0 }, data: { id, kind: "bash", label: id } };
}

function edge(source: string, target: string): Edge {
  return { id: `${source}->${target}`, source, target };
}

describe("hasCycle", () => {
  it("returns false for an acyclic DAG", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [edge("a", "b"), edge("b", "c")];
    expect(hasCycle(nodes, edges)).toBe(false);
  });

  it("returns true for a simple 2-node cycle", () => {
    const nodes = [node("a"), node("b")];
    const edges = [edge("a", "b"), edge("b", "a")];
    expect(hasCycle(nodes, edges)).toBe(true);
  });

  it("returns true for a self-loop", () => {
    const nodes = [node("a")];
    const edges = [edge("a", "a")];
    expect(hasCycle(nodes, edges)).toBe(true);
  });
});

describe("computeTopologicalLayers", () => {
  it("orders a fan-out/fan-in graph into correct layers", () => {
    // a -> b, a -> c, b -> d, c -> d
    const nodes = [node("a"), node("b"), node("c"), node("d")];
    const edges = [edge("a", "b"), edge("a", "c"), edge("b", "d"), edge("c", "d")];
    const layers = computeTopologicalLayers(nodes, edges);
    expect(layers).toHaveLength(3);
    expect(layers[0]).toEqual(["a"]);
    expect(new Set(layers[1])).toEqual(new Set(["b", "c"]));
    expect(layers[2]).toEqual(["d"]);
  });

  it("places every independent root in layer 0", () => {
    const nodes = [node("a"), node("b")];
    const layers = computeTopologicalLayers(nodes, []);
    expect(layers).toHaveLength(1);
    expect(new Set(layers[0])).toEqual(new Set(["a", "b"]));
  });
});
