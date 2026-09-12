import { describe, expect, it } from "vitest";
import { TRIGGER_RULES, workflowDefinitionSchema, workflowNodeSchema } from "./schema";

describe("TRIGGER_RULES", () => {
  it("matches Archon's authoritative trigger rule set", () => {
    expect(TRIGGER_RULES).toEqual([
      "all_success",
      "one_success",
      "none_failed_min_one_success",
      "all_done",
    ]);
  });

  it("does not include the invented, never-real any_success value", () => {
    expect(TRIGGER_RULES).not.toContain("any_success");
  });

  it.each(TRIGGER_RULES)("accepts trigger_rule: %s on a node", (rule) => {
    const result = workflowNodeSchema.safeParse({ id: "n1", trigger_rule: rule });
    expect(result.success).toBe(true);
  });

  it("rejects the old, nonexistent any_success value", () => {
    const result = workflowNodeSchema.safeParse({ id: "n1", trigger_rule: "any_success" });
    expect(result.success).toBe(false);
  });
});

describe("workflowDefinitionSchema", () => {
  it("rejects a missing description (#29 — Archon requires a non-empty description)", () => {
    const result = workflowDefinitionSchema.safeParse({ name: "wf", nodes: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an empty-string description", () => {
    const result = workflowDefinitionSchema.safeParse({
      name: "wf",
      description: "",
      nodes: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a non-empty description", () => {
    const result = workflowDefinitionSchema.safeParse({
      name: "wf",
      description: "does a thing",
      nodes: [],
    });
    expect(result.success).toBe(true);
  });

  it("preserves unmodeled workflow-level fields (e.g. sandbox, tags) instead of stripping them (#29)", () => {
    const result = workflowDefinitionSchema.safeParse({
      name: "wf",
      description: "does a thing",
      nodes: [],
      sandbox: true,
      tags: ["ci"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ sandbox: true, tags: ["ci"] });
    }
  });
});
