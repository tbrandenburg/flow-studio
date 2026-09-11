import { describe, expect, it } from "vitest";
import { NODE_KINDS } from "./kinds";
import { createFlowNode, createNodeData } from "./createNode";

describe("createNodeData", () => {
  for (const kind of NODE_KINDS) {
    it(`produces valid default data for kind "${kind.id}"`, () => {
      const data = createNodeData(kind.id);
      expect(data.kind).toBe(kind.id);
      expect(data.label).toBeTruthy();
    });
  }
});

describe("createFlowNode", () => {
  it("creates a positioned node with a fresh id", () => {
    const node = createFlowNode("prompt", { x: 10, y: 20 });
    expect(node.position).toEqual({ x: 10, y: 20 });
    expect(node.data.kind).toBe("prompt");
    expect(node.id).toMatch(/^node-/);
  });
});
