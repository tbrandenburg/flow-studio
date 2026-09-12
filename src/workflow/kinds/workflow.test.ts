import { describe, expect, it } from "vitest";
import { workflowKind } from "./workflow";
import { NODE_KINDS } from "./index";
import { fromYaml, toYaml } from "../yaml";
import type { WorkflowDefinition } from "../schema";

describe("workflowKind.fromYaml", () => {
  it("parses a minimal workflow node", () => {
    const result = workflowKind.fromYaml({ workflow: "sub-workflow" });
    expect(result).toEqual({
      kind: "workflow",
      label: "Workflow",
      workflow: "sub-workflow",
      input: undefined,
      with: undefined,
      isolation: undefined,
      fan_out: undefined,
    });
  });

  it("parses input, with, isolation, and an opaque fan_out object", () => {
    const result = workflowKind.fromYaml({
      workflow: "sub-workflow",
      input: "some input",
      with: { branch: "feature/x" },
      isolation: "worktree",
      fan_out: { items: "${matrix}", max_parallel: 3, join: "all_success" },
    });
    expect(result?.input).toBe("some input");
    expect(result?.with).toEqual({ branch: "feature/x" });
    expect(result?.isolation).toBe("worktree");
    expect(result?.fan_out).toEqual({ items: "${matrix}", max_parallel: 3, join: "all_success" });
  });

  it("returns null when workflow key is missing", () => {
    expect(workflowKind.fromYaml({})).toBeNull();
  });

  it("returns null when workflow is not a string", () => {
    expect(workflowKind.fromYaml({ workflow: 123 })).toBeNull();
  });
});

describe("workflowKind.toYaml", () => {
  it("round-trips all fields including opaque fan_out", () => {
    const parsed = workflowKind.fromYaml({
      workflow: "sub-workflow",
      input: "some input",
      with: { branch: "feature/x" },
      isolation: "inherit",
      fan_out: { items: "${matrix}", max_parallel: 3, join: "all_success" },
    });
    expect(parsed).not.toBeNull();
    const yaml = workflowKind.toYaml(parsed as never);
    expect(yaml).toEqual({
      workflow: "sub-workflow",
      input: "some input",
      with: { branch: "feature/x" },
      isolation: "inherit",
      fan_out: { items: "${matrix}", max_parallel: 3, join: "all_success" },
    });
  });

  it("omits optional fields when absent", () => {
    const parsed = workflowKind.fromYaml({ workflow: "sub-workflow" });
    const yaml = workflowKind.toYaml(parsed as never);
    expect(yaml).toEqual({ workflow: "sub-workflow" });
  });
});

describe("workflowKind registration", () => {
  it("is registered before promptKind and unknownKind", () => {
    const ids = NODE_KINDS.map((k) => k.id);
    expect(ids).toContain("workflow");
    expect(ids.indexOf("workflow")).toBeLessThan(ids.indexOf("prompt"));
    expect(ids.at(-1)).toBe("unknown");
  });
});

describe("workflow node full-file round-trip", () => {
  function fixtureWithWorkflowNode(): WorkflowDefinition {
    return {
      name: "deliver",
      nodes: [
        {
          id: "run-sub",
          workflow: "sub-workflow",
          input: "some input",
          with: { branch: "feature/x" },
          isolation: "worktree",
          fan_out: { items: "${matrix}", max_parallel: 3, join: "all_success" },
          depends_on: [],
        },
      ],
    };
  }

  it("imports and round-trips a workflow node losslessly, including opaque fan_out", () => {
    const def = fixtureWithWorkflowNode();
    const yaml = toYaml(def);
    const parsed = fromYaml(yaml);

    const node = parsed.nodes.find((n) => n.id === "run-sub");
    expect(node).toMatchObject({
      id: "run-sub",
      workflow: "sub-workflow",
      input: "some input",
      with: { branch: "feature/x" },
      isolation: "worktree",
      fan_out: { items: "${matrix}", max_parallel: 3, join: "all_success" },
    });
  });
});
