import { describe, expect, it } from "vitest";
import { includeKind } from "./include";
import { NODE_KINDS } from "./index";
import { fromYaml, toYaml } from "../yaml";
import type { WorkflowDefinition } from "../schema";

describe("includeKind.fromYaml", () => {
  it("parses a minimal include node", () => {
    const result = includeKind.fromYaml({ include: "sub-workflow" });
    expect(result).toEqual({
      kind: "include",
      label: "Include",
      include: "sub-workflow",
      with: undefined,
      fan_out: undefined,
    });
  });

  it("parses with bindings and a boolean fan_out", () => {
    const result = includeKind.fromYaml({
      include: "sub-workflow",
      with: { branch: "feature/x", reviewer: "alice" },
      fan_out: true,
    });
    expect(result?.with).toEqual({ branch: "feature/x", reviewer: "alice" });
    expect(result?.fan_out).toBe(true);
  });

  it("returns null when include key is missing", () => {
    expect(includeKind.fromYaml({})).toBeNull();
  });
});

describe("includeKind.toYaml", () => {
  it("round-trips include, with, and fan_out", () => {
    const parsed = includeKind.fromYaml({
      include: "sub-workflow",
      with: { branch: "feature/x" },
      fan_out: true,
    });
    expect(parsed).not.toBeNull();
    const yaml = includeKind.toYaml(parsed as never);
    expect(yaml).toEqual({
      include: "sub-workflow",
      with: { branch: "feature/x" },
      fan_out: true,
    });
  });

  it("omits with/fan_out when absent", () => {
    const parsed = includeKind.fromYaml({ include: "sub-workflow" });
    const yaml = includeKind.toYaml(parsed as never);
    expect(yaml).toEqual({ include: "sub-workflow" });
  });
});

describe("includeKind registration", () => {
  it("is registered before promptKind and unknownKind", () => {
    const ids = NODE_KINDS.map((k) => k.id);
    expect(ids).toContain("include");
    expect(ids.indexOf("include")).toBeLessThan(ids.indexOf("prompt"));
    expect(ids.at(-1)).toBe("unknown");
  });
});

describe("include node full-file round-trip", () => {
  function fixtureWithIncludeNode(): WorkflowDefinition {
    return {
      name: "deliver",
      nodes: [
        {
          id: "run-sub-workflow",
          include: "some-workflow-name",
          with: { branch: "feature/x", reviewer: "alice" },
          fan_out: true,
          depends_on: [],
        },
      ],
    };
  }

  it("imports and round-trips an include node losslessly", () => {
    const def = fixtureWithIncludeNode();
    const yaml = toYaml(def);
    const parsed = fromYaml(yaml);

    const node = parsed.nodes.find((n) => n.id === "run-sub-workflow");
    expect(node).toMatchObject({
      id: "run-sub-workflow",
      include: "some-workflow-name",
      with: { branch: "feature/x", reviewer: "alice" },
      fan_out: true,
    });
  });
});
