import { describe, expect, it } from "vitest";
import { NODE_KINDS } from "./kinds";
import { createFlowNode, createNodeData } from "./createNode";

describe("createNodeData", () => {
  for (const kind of NODE_KINDS) {
    it(`produces valid default data for kind "${kind.id}"`, () => {
      const data = createNodeData(kind.id);
      expect(data.kind).toBe(kind.id);
      expect(data.label).toBeTruthy();
      // A freshly-dropped, untouched node may still be missing required
      // fields (structural fields like `loop_group.nodes` or required
      // text fields legitimately fail with "too_small"/"invalid_type"),
      // but a select/record/boolean FieldSpec must never manufacture its
      // own validation error just from being defaulted (issue #36:
      // `""` isn't a valid value for `.optional()` select/record/boolean
      // schemas).
      const result = kind.schema.safeParse(data);
      const optionalFieldNames = new Set(
        kind.fields
          .filter((field) => !field.required)
          .filter(
            (field) =>
              field.type === "select" || field.type === "record" || field.type === "boolean",
          )
          .map((field) => field.name),
      );
      if (!result.success) {
        const spuriousIssues = result.error.issues.filter((issue) =>
          optionalFieldNames.has(issue.path.join(".")),
        );
        expect(spuriousIssues).toEqual([]);
      }
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
