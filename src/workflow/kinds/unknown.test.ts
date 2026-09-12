import { describe, expect, it } from "vitest";
import { unknownKind } from "./unknown";
import { NODE_KINDS } from "./index";
import { fromYaml, toYaml } from "../yaml";
import type { WorkflowDefinition } from "../schema";

describe("unknownKind", () => {
  it("always matches any raw node shape", () => {
    expect(unknownKind.fromYaml({ id: "n1", compose_fan_out: { items: "x" } })).not.toBeNull();
    expect(unknownKind.fromYaml({})).not.toBeNull();
  });

  it("strips common fields from the stored raw payload", () => {
    const result = unknownKind.fromYaml({
      id: "n1",
      depends_on: ["a"],
      label: "My label",
      when: "cond",
      trigger_rule: "all_done",
      compose_fan_out: { items: "x" },
      timeout: 30,
    });
    expect(result?.raw).toEqual({ compose_fan_out: { items: "x" }, timeout: 30 });
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

    const scriptResult = NODE_KINDS.find((k) => k.fromYaml({ script: "x" }) !== null);
    expect(scriptResult?.id).toBe("script");

    const haltResult = NODE_KINDS.find((k) => k.fromYaml({ cancel: "reason" }) !== null);
    expect(haltResult?.id).toBe("halt");

    const workflowResult = NODE_KINDS.find((k) => k.fromYaml({ workflow: "x" }) !== null);
    expect(workflowResult?.id).toBe("workflow");
  });
});

describe("unknown kind full-file round-trip", () => {
  function fixtureWithUnknownNode(): WorkflowDefinition {
    return {
      name: "deliver",
      description: "test fixture",
      nodes: [
        {
          id: "node-fanout1",
          compose_fan_out: { items: "${matrix}", max_parallel: 2 },
          args: ["--env", "prod"],
          depends_on: [],
        },
        {
          id: "node-bash1",
          bash: "echo done",
          depends_on: ["node-fanout1"],
        },
      ],
    };
  }

  it("imports a file containing an unsupported `compose_fan_out:` node without throwing", () => {
    const def = fixtureWithUnknownNode();
    const yaml = toYaml(def);
    expect(() => fromYaml(yaml)).not.toThrow();
  });

  it("round-trips the unsupported node's keys/values losslessly through the graph layer", () => {
    const def = fixtureWithUnknownNode();
    const yaml = toYaml(def);
    const parsed = fromYaml(yaml);

    const fanOutNode = parsed.nodes.find((n) => n.id === "node-fanout1");
    expect(fanOutNode).toMatchObject({
      id: "node-fanout1",
      compose_fan_out: { items: "${matrix}", max_parallel: 2 },
      args: ["--env", "prod"],
    });
  });
});
