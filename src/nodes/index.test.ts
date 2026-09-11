import { describe, expect, it } from "vitest";

import { initialNodes, nodeTypes } from "./index";

describe("initialNodes", () => {
  it("has unique ids", () => {
    const ids = initialNodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references node types that are registered in nodeTypes", () => {
    const types = initialNodes.map((node) => node.type ?? "default");

    for (const type of types) {
      expect(nodeTypes).toHaveProperty(type);
    }
  });

  it("overrides all built-in node type keys with editable label renderers", () => {
    expect(Object.keys(nodeTypes).sort()).toEqual([
      "default",
      "input",
      "output",
      "position-logger",
    ]);
  });
});
