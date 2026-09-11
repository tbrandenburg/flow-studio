import { describe, expect, it } from "vitest";

import { initialNodes, nodeTypes } from "./index";

describe("initialNodes", () => {
  it("has unique ids", () => {
    const ids = initialNodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only references node types that are registered in nodeTypes", () => {
    const customTypes = initialNodes
      .map((node) => node.type)
      .filter(
        (type): type is string =>
          Boolean(type) && !["input", "output", "default"].includes(type ?? ""),
      );

    for (const type of customTypes) {
      expect(nodeTypes).toHaveProperty(type);
    }
  });
});
