import { describe, expect, it } from "vitest";
import { unknownKind } from "./unknown";
import { NODE_KINDS } from "./index";
import { fromYaml, toYaml } from "../yaml";
import type { WorkflowDefinition } from "../schema";

describe("unknownKind", () => {
  it("always matches any raw node shape", () => {
    expect(unknownKind.fromYaml({ id: "n1", script: "deploy.sh" })).not.toBeNull();
    expect(unknownKind.fromYaml({})).not.toBeNull();
  });

  it("strips common fields from the stored raw payload", () => {
    const result = unknownKind.fromYaml({
      id: "n1",
      depends_on: ["a"],
      label: "My label",
      when: "cond",
      trigger_rule: "all_done",
      script: "deploy.sh",
      timeout: 30,
    });
    expect(result?.raw).toEqual({ script: "deploy.sh", timeout: 30 });
  });

  it("reconstructs the raw node body losslessly via toYaml", () => {
    const raw = { script: "deploy.sh", args: ["--prod"], nested: { retries: 2 } };
    const data = { id: "n1", kind: "unknown", label: "Unknown", raw };
    expect(unknownKind.toYaml(data)).toEqual(raw);
  });

  it("is registered last in NODE_KINDS as the catch-all fallback", () => {
    expect(NODE_KINDS.at(-1)).toBe(unknownKind);
  });

  it("does not shadow kinds with a registered handler", () => {
    const bashResult = NODE_KINDS.find((k) => k.fromYaml({ bash: "echo hi" }) !== null);
    expect(bashResult?.id).toBe("bash");
  });
});

describe("unknown kind full-file round-trip", () => {
  function fixtureWithUnknownNode(): WorkflowDefinition {
    return {
      name: "deliver",
      nodes: [
        {
          id: "node-script1",
          script: "deploy.sh",
          args: ["--env", "prod"],
          depends_on: [],
        },
        {
          id: "node-bash1",
          bash: "echo done",
          depends_on: ["node-script1"],
        },
      ],
    };
  }

  it("imports a file containing an unsupported `script:` node without throwing", () => {
    const def = fixtureWithUnknownNode();
    const yaml = toYaml(def);
    expect(() => fromYaml(yaml)).not.toThrow();
  });

  it("round-trips the unsupported node's keys/values losslessly through the graph layer", () => {
    const def = fixtureWithUnknownNode();
    const yaml = toYaml(def);
    const parsed = fromYaml(yaml);

    const scriptNode = parsed.nodes.find((n) => n.id === "node-script1");
    expect(scriptNode).toMatchObject({
      id: "node-script1",
      script: "deploy.sh",
      args: ["--env", "prod"],
    });
  });
});
