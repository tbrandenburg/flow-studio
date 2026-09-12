import { describe, expect, it } from "vitest";
import { TRIGGER_RULES, workflowNodeSchema } from "./schema";

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
