import { describe, expect, it } from "vitest";
import { scriptKind } from "./script";
import { NODE_KINDS } from "./index";
import { fromYaml, toYaml } from "../yaml";
import type { WorkflowDefinition } from "../schema";

describe("scriptKind.fromYaml", () => {
  it("parses a minimal script node", () => {
    const result = scriptKind.fromYaml({ script: "deploy.sh" });
    expect(result).toEqual({
      kind: "script",
      label: "Script",
      script: "deploy.sh",
      runtime: undefined,
      deps: undefined,
      timeout: undefined,
      on_timeout: undefined,
      with: undefined,
    });
  });

  it("parses runtime, deps, and timeout", () => {
    const result = scriptKind.fromYaml({
      script: "build.ts",
      runtime: "bun",
      deps: ["typescript"],
      timeout: 5000,
    });
    expect(result?.runtime).toBe("bun");
    expect(result?.deps).toEqual(["typescript"]);
    expect(result?.timeout).toBe(5000);
  });

  it("parses on_timeout and with", () => {
    const result = scriptKind.fromYaml({
      script: "build.ts",
      on_timeout: "skip",
      with: { input: "value" },
    });
    expect(result?.on_timeout).toBe("skip");
    expect(result?.with).toEqual({ input: "value" });
  });

  it("returns null when script key is missing", () => {
    expect(scriptKind.fromYaml({})).toBeNull();
  });

  it("returns null when script is not a string", () => {
    expect(scriptKind.fromYaml({ script: 123 })).toBeNull();
  });
});

describe("scriptKind.toYaml", () => {
  it("round-trips script, runtime, deps, and timeout", () => {
    const parsed = scriptKind.fromYaml({
      script: "build.ts",
      runtime: "uv",
      deps: ["typescript"],
      timeout: 5000,
    });
    expect(parsed).not.toBeNull();
    const yaml = scriptKind.toYaml(parsed as never);
    expect(yaml).toEqual({
      script: "build.ts",
      runtime: "uv",
      deps: ["typescript"],
      timeout: 5000,
    });
  });

  it("round-trips on_timeout and with", () => {
    const parsed = scriptKind.fromYaml({
      script: "build.ts",
      on_timeout: "skip",
      with: { input: "value" },
    });
    expect(parsed).not.toBeNull();
    const yaml = scriptKind.toYaml(parsed as never);
    expect(yaml).toEqual({
      script: "build.ts",
      on_timeout: "skip",
      with: { input: "value" },
    });
  });

  it("omits optional fields when absent", () => {
    const parsed = scriptKind.fromYaml({ script: "deploy.sh" });
    const yaml = scriptKind.toYaml(parsed as never);
    expect(yaml).toEqual({ script: "deploy.sh" });
  });
});

describe("scriptKind.schema runtime validation", () => {
  it("rejects runtime: sh (reserved for bash nodes)", () => {
    const result = scriptKind.schema.safeParse({ script: "x", runtime: "sh" });
    expect(result.success).toBe(false);
  });

  it("accepts runtime: bun", () => {
    const result = scriptKind.schema.safeParse({ script: "x", runtime: "bun" });
    expect(result.success).toBe(true);
  });

  it("accepts runtime: uv", () => {
    const result = scriptKind.schema.safeParse({ script: "x", runtime: "uv" });
    expect(result.success).toBe(true);
  });
});

describe("scriptKind registration", () => {
  it("is registered before promptKind and unknownKind", () => {
    const ids = NODE_KINDS.map((k) => k.id);
    expect(ids).toContain("script");
    expect(ids.indexOf("script")).toBeLessThan(ids.indexOf("prompt"));
    expect(ids.at(-1)).toBe("unknown");
  });
});

describe("script node full-file round-trip", () => {
  function fixtureWithScriptNode(): WorkflowDefinition {
    return {
      name: "deliver",
      description: "test fixture",
      nodes: [
        {
          id: "run-script",
          script: "build.ts",
          runtime: "bun",
          deps: ["typescript"],
          timeout: 5000,
          depends_on: [],
        },
      ],
    };
  }

  it("imports and round-trips a script node losslessly", () => {
    const def = fixtureWithScriptNode();
    const yaml = toYaml(def);
    const parsed = fromYaml(yaml);

    const node = parsed.nodes.find((n) => n.id === "run-script");
    expect(node).toMatchObject({
      id: "run-script",
      script: "build.ts",
      runtime: "bun",
      deps: ["typescript"],
      timeout: 5000,
    });
  });
});
