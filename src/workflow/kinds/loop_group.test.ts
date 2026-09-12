import { describe, expect, it } from "vitest";
import { loopGroupKind } from "./loop_group";
import { NODE_KINDS } from "./index";
import { fromYaml, toYaml } from "../yaml";
import type { WorkflowDefinition } from "../schema";

describe("loopGroupKind.fromYaml", () => {
  it("parses a minimal loop_group node", () => {
    const result = loopGroupKind.fromYaml({ loop_group: {} });
    expect(result).toEqual({
      kind: "loop_group",
      label: "Loop group",
      until_bash: undefined,
      max_iterations: undefined,
      fresh_context: undefined,
      nodes: undefined,
    });
  });

  it("parses fields and nested nodes", () => {
    const result = loopGroupKind.fromYaml({
      loop_group: {
        until_bash: 'test $recheck.output.action != "correct"',
        max_iterations: 5,
        fresh_context: true,
        nodes: [
          { id: "ci-note", bash: "echo hi", timeout: 45000, on_timeout: "skip" },
          { id: "recheck", include: "archon-review" },
        ],
      },
    });
    expect(result?.until_bash).toBe('test $recheck.output.action != "correct"');
    expect(result?.max_iterations).toBe(5);
    expect(result?.fresh_context).toBe(true);
    expect(result?.nodes).toEqual([
      { id: "ci-note", bash: "echo hi", timeout: 45000, on_timeout: "skip" },
      { id: "recheck", include: "archon-review" },
    ]);
  });

  it("returns null when loop_group key is missing", () => {
    expect(loopGroupKind.fromYaml({})).toBeNull();
  });
});

describe("loopGroupKind.toYaml", () => {
  it("round-trips all fields under the loop_group key", () => {
    const parsed = loopGroupKind.fromYaml({
      loop_group: {
        until_bash: "test 1 == 1",
        max_iterations: 3,
        fresh_context: false,
        nodes: [{ id: "a", bash: "echo a" }],
      },
    });
    expect(parsed).not.toBeNull();
    const yaml = loopGroupKind.toYaml(parsed as never);
    expect(yaml).toEqual({
      loop_group: {
        until_bash: "test 1 == 1",
        max_iterations: 3,
        fresh_context: false,
        nodes: [{ id: "a", bash: "echo a" }],
      },
    });
  });

  it("omits absent optional fields", () => {
    const parsed = loopGroupKind.fromYaml({ loop_group: {} });
    const yaml = loopGroupKind.toYaml(parsed as never);
    expect(yaml).toEqual({ loop_group: {} });
  });
});

describe("loopGroupKind registration", () => {
  it("is registered before promptKind and unknownKind", () => {
    const ids = NODE_KINDS.map((k) => k.id);
    expect(ids).toContain("loop_group");
    expect(ids.indexOf("loop_group")).toBeLessThan(ids.indexOf("prompt"));
    expect(ids.at(-1)).toBe("unknown");
  });
});

describe("loop_group node full-file round-trip", () => {
  function fixtureWithLoopGroupNode(): WorkflowDefinition {
    return {
      name: "deliver",
      nodes: [
        {
          id: "corrections",
          depends_on: ["review"],
          when: "$review.output.action == 'correct'",
          loop_group: {
            until_bash: 'test $recheck.output.action != "correct"',
            max_iterations: 5,
            fresh_context: true,
            nodes: [
              { id: "ci-note", bash: "echo checking", timeout: 45000, on_timeout: "skip" },
              { id: "recheck", include: "archon-review" },
            ],
          },
        },
      ],
    };
  }

  it("validates a full workflow file containing a loop_group node", () => {
    const def = fixtureWithLoopGroupNode();
    const yaml = toYaml(def);
    // yaml.ts's fromYaml only validates node shape generically (each kind's
    // fromYaml must return non-null); it does not flatten kind-specific
    // fields onto the node. Successful parsing here proves the raw
    // `loop_group:` shape (including its nested `nodes:` array) is accepted
    // as a valid node by the registry.
    const parsed = fromYaml(yaml);
    const rawNode = parsed.nodes.find((n) => n.id === "corrections") as unknown as Record<
      string,
      unknown
    >;
    expect(rawNode?.loop_group).toEqual(def.nodes[0].loop_group);
  });

  it("round-trips a loop_group node's nested nodes losslessly via the kind directly", () => {
    const rawNode = fixtureWithLoopGroupNode().nodes[0] as unknown as Record<string, unknown>;
    const parsed = loopGroupKind.fromYaml(rawNode);
    expect(parsed).not.toBeNull();
    expect(parsed?.nodes).toEqual((rawNode.loop_group as Record<string, unknown>).nodes);

    const yamlOut = loopGroupKind.toYaml(parsed as never);
    expect(yamlOut).toEqual({ loop_group: rawNode.loop_group });

    // Re-running fromYaml/toYaml again must reproduce the exact same nested
    // structure (proving lossless round-trip regardless of depth).
    const reParsed = loopGroupKind.fromYaml(yamlOut);
    const reYamlOut = loopGroupKind.toYaml(reParsed as never);
    expect(reYamlOut).toEqual(yamlOut);
  });
});
