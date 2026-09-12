import { describe, expect, it } from "vitest";
import { haltKind } from "./halt";
import { NODE_KINDS } from "./index";
import { fromYaml, toYaml } from "../yaml";
import type { WorkflowDefinition } from "../schema";

describe("haltKind.fromYaml", () => {
  it("parses a cancel node", () => {
    const result = haltKind.fromYaml({ cancel: "budget exceeded" });
    expect(result).toEqual({
      kind: "halt",
      label: "Halt",
      reason: "budget exceeded",
    });
  });

  it("returns null when cancel key is missing", () => {
    expect(haltKind.fromYaml({})).toBeNull();
  });

  it("returns null when cancel is not a string", () => {
    expect(haltKind.fromYaml({ cancel: 123 })).toBeNull();
  });
});

describe("haltKind.toYaml", () => {
  it("round-trips reason to the cancel key", () => {
    const parsed = haltKind.fromYaml({ cancel: "budget exceeded" });
    expect(parsed).not.toBeNull();
    const yaml = haltKind.toYaml(parsed as never);
    expect(yaml).toEqual({ cancel: "budget exceeded" });
  });
});

describe("haltKind registration", () => {
  it("is registered before promptKind and unknownKind", () => {
    const ids = NODE_KINDS.map((k) => k.id);
    expect(ids).toContain("halt");
    expect(ids.indexOf("halt")).toBeLessThan(ids.indexOf("prompt"));
    expect(ids.at(-1)).toBe("unknown");
  });
});

describe("halt node full-file round-trip", () => {
  function fixtureWithHaltNode(): WorkflowDefinition {
    return {
      name: "deliver",
      description: "test fixture",
      nodes: [
        {
          id: "stop-run",
          cancel: "budget exceeded",
          depends_on: [],
        },
      ],
    };
  }

  it("imports and round-trips a halt node losslessly", () => {
    const def = fixtureWithHaltNode();
    const yaml = toYaml(def);
    const parsed = fromYaml(yaml);

    const node = parsed.nodes.find((n) => n.id === "stop-run");
    expect(node).toMatchObject({
      id: "stop-run",
      cancel: "budget exceeded",
    });
  });
});
