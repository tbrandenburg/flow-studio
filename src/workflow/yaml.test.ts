import { describe, expect, it } from "vitest";
import { fromYaml, toYaml, WorkflowYamlError } from "./yaml";
import type { WorkflowDefinition } from "./schema";

function fixtureDefinition(): WorkflowDefinition {
  return {
    name: "ci-triage",
    description: "Triage a failing CI run and propose a fix",
    provider: "anthropic",
    model: "claude-sonnet-4",
    nodes: [
      {
        id: "node-a1b2c3d4",
        prompt: "Read the failing job log and summarise the root cause\nin at most three sentences.",
        model: "claude-sonnet-4",
        output_format: "json",
      },
      {
        id: "node-e5f6g7h8",
        bash: "#!/usr/bin/env bash\nset -euo pipefail\nnpm test 2>&1 | tail -50",
        timeout: 120000,
        depends_on: ["node-a1b2c3d4"],
      },
      {
        id: "node-i9j0k1l2",
        command: "propose-fix",
        depends_on: ["node-a1b2c3d4", "node-e5f6g7h8"],
        when: "${node-e5f6g7h8.exit_code} != 0",
        trigger_rule: "all_done",
      },
      {
        id: "node-loop1",
        loop: { command: "retry-step", max_iterations: 3 },
        depends_on: ["node-i9j0k1l2"],
      },
      {
        id: "node-approval1",
        approval: { message: "Confirm the fix before merging" },
        depends_on: ["node-loop1"],
      },
      {
        id: "node-wait1",
        wait: { duration_ms: "5000" },
        depends_on: ["node-approval1"],
      },
    ],
  };
}

describe("yaml round-trip", () => {
  it("preserves all six kinds, multiline strings, a when with : and #, and multi-depends_on", () => {
    const def = fixtureDefinition();
    const yaml = toYaml(def);
    const parsed = fromYaml(yaml);
    expect(parsed).toEqual(def);
  });

  it("survives timeout: 0 without dropping it", () => {
    const def = fixtureDefinition();
    def.nodes[1] = { ...def.nodes[1], timeout: 0 };
    const yaml = toYaml(def);
    expect(yaml).toContain("timeout: 0");
    const parsed = fromYaml(yaml);
    expect(parsed.nodes[1]).toMatchObject({ timeout: 0 });
  });

  it("never emits depends_on: [] for a root node", () => {
    const def = fixtureDefinition();
    const yaml = toYaml(def);
    expect(yaml).not.toContain("depends_on: []");
    expect(yaml.split("\n").filter((line) => line.includes("node-a1b2c3d4"))[0]).toBeDefined();
  });

  it("throws a typed error for malformed YAML text", () => {
    expect(() => fromYaml("nodes: [unterminated")).toThrow(WorkflowYamlError);
  });

  it("throws a typed error for schema-invalid YAML (missing name)", () => {
    expect(() => fromYaml("nodes: []")).toThrow(WorkflowYamlError);
  });
});
