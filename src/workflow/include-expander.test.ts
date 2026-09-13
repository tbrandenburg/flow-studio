import { describe, expect, it } from "vitest";
import { expandIncludes, INCLUDE_MAX_DEPTH, type WorkflowMap } from "./include-expander";
import type { WorkflowDefinition, WorkflowNode } from "./schema";

function def(name: string, nodes: WorkflowNode[]): WorkflowDefinition {
  return { name, description: "test", nodes };
}

function node(id: string, extra: Record<string, unknown> = {}): WorkflowNode {
  return { id, ...extra } as WorkflowNode;
}

describe("expandIncludes", () => {
  it("inlines a target workflow's nodes, namespaced by includeId__childId", () => {
    const sub = def("sub", [node("a"), node("b", { depends_on: ["a"] })]);
    const map: WorkflowMap = new Map([["sub", sub]]);
    const parent = def("parent", [node("step1", { include: "sub" })]);

    const result = expandIncludes(parent, map);

    expect(result.issues).toEqual([]);
    const ids = result.definition.nodes.map((n) => n.id);
    expect(ids).toEqual(["step1__a", "step1__b"]);
    const b = result.definition.nodes.find((n) => n.id === "step1__b");
    expect(b?.depends_on).toEqual(["step1__a"]);
  });

  it("rewrites internal $id.output refs to namespaced ids", () => {
    const sub = def("sub", [
      node("a"),
      node("b", { depends_on: ["a"], when: "$a.output == 'ok'" }),
    ]);
    const map: WorkflowMap = new Map([["sub", sub]]);
    const parent = def("parent", [node("step1", { include: "sub" })]);

    const result = expandIncludes(parent, map);

    const b = result.definition.nodes.find((n) => n.id === "step1__b");
    expect(b?.when).toBe("$step1__a.output == 'ok'");
  });

  it("resolves parent depends_on on the include id to all sub-graph sinks", () => {
    const sub = def("sub", [
      node("a"),
      node("b", { depends_on: ["a"] }),
      node("c", { depends_on: ["a"] }),
    ]);
    const map: WorkflowMap = new Map([["sub", sub]]);
    const parent = def("parent", [
      node("step1", { include: "sub" }),
      node("after", { depends_on: ["step1"] }),
    ]);

    const result = expandIncludes(parent, map);

    const after = result.definition.nodes.find((n) => n.id === "after");
    expect(after?.depends_on?.sort()).toEqual(["step1__b", "step1__c"]);
  });

  it("narrows $includeId.output refs to the declared returns node, not all sinks", () => {
    const sub = def("sub", [
      node("a"),
      node("b", { depends_on: ["a"] }),
      node("c", { depends_on: ["a"] }),
    ]);
    const map: WorkflowMap = new Map([["sub", sub]]);
    const parent = def("parent", [
      node("step1", { include: "sub", returns: "b" }),
      node("after", { when: "$step1.output" }),
    ]);

    const result = expandIncludes(parent, map);

    const after = result.definition.nodes.find((n) => n.id === "after");
    expect(after?.when).toBe("$step1__b.output");
  });

  it("defaults primary output ref to the first sink in definition order when no returns is set", () => {
    const sub = def("sub", [
      node("a"),
      node("b", { depends_on: ["a"] }),
      node("c", { depends_on: ["a"] }),
    ]);
    const map: WorkflowMap = new Map([["sub", sub]]);
    const parent = def("parent", [
      node("step1", { include: "sub" }),
      node("after", { when: "$step1.output" }),
    ]);

    const result = expandIncludes(parent, map);

    const after = result.definition.nodes.find((n) => n.id === "after");
    expect(after?.when).toBe("$step1__b.output");
  });

  it("attaches the include node's own depends_on/when/trigger_rule to sub-graph entry nodes", () => {
    const sub = def("sub", [node("a"), node("b", { depends_on: ["a"] })]);
    const map: WorkflowMap = new Map([["sub", sub]]);
    const parent = def("parent", [
      node("before", {}),
      node("step1", {
        include: "sub",
        depends_on: ["before"],
        when: "$before.ok",
        trigger_rule: "all_success",
      }),
    ]);

    const result = expandIncludes(parent, map);

    const a = result.definition.nodes.find((n) => n.id === "step1__a");
    expect(a?.depends_on).toEqual(["before"]);
    expect(a?.when).toBe("$before.ok");
    expect(a?.trigger_rule).toBe("all_success");
    const b = result.definition.nodes.find((n) => n.id === "step1__b");
    expect(b?.depends_on).toEqual(["step1__a"]);
  });

  it("supports multi-level nested includes up to depth 3", () => {
    const level3 = def("level3", [node("x")]);
    const level2 = def("level2", [node("mid", { include: "level3" })]);
    const level1 = def("level1", [node("outer", { include: "level2" })]);
    const map: WorkflowMap = new Map([
      ["level3", level3],
      ["level2", level2],
    ]);
    const parent = def("parent", [node("step1", { include: "level1" })]);
    // level1 is resolved directly as the include target here, so put it in the map too.
    map.set("level1", level1);

    const result = expandIncludes(parent, map);

    expect(result.issues).toEqual([]);
    const ids = result.definition.nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["step1__outer__mid__x"]);
  });

  it("reports depth-exceeded instead of infinitely recursing beyond INCLUDE_MAX_DEPTH", () => {
    // Chain of includes one level deeper than allowed.
    const names = Array.from({ length: INCLUDE_MAX_DEPTH + 2 }, (_, i) => `w${i}`);
    const map: WorkflowMap = new Map();
    for (let i = 0; i < names.length - 1; i++) {
      map.set(names[i], def(names[i], [node("n", { include: names[i + 1] })]));
    }
    map.set(names.at(-1) as string, def(names.at(-1) as string, [node("leaf")]));
    const parent = def("parent", [node("step1", { include: names[0] })]);

    const result = expandIncludes(parent, map);

    expect(result.issues.some((issue) => issue.type === "depth-exceeded")).toBe(true);
  });

  it("detects a cycle and reports it instead of looping forever", () => {
    const a = def("a", [node("n", { include: "b" })]);
    const b = def("b", [node("n", { include: "a" })]);
    const map: WorkflowMap = new Map([
      ["a", a],
      ["b", b],
    ]);
    const parent = def("parent", [node("step1", { include: "a" })]);

    const result = expandIncludes(parent, map);

    expect(result.issues.some((issue) => issue.type === "cycle")).toBe(true);
  });

  it("reports an unresolved include target without throwing", () => {
    const map: WorkflowMap = new Map();
    const parent = def("parent", [node("step1", { include: "does-not-exist" })]);

    const result = expandIncludes(parent, map);

    expect(result.issues).toEqual([
      { type: "unresolved", nodeId: "step1", include: "does-not-exist" },
    ]);
    // Original node is left untouched when unresolved.
    expect(result.definition.nodes).toEqual(parent.nodes);
  });

  it("leaves a node with fan_out set unexpanded / pass-through", () => {
    const sub = def("sub", [node("a")]);
    const map: WorkflowMap = new Map([["sub", sub]]);
    const parent = def("parent", [
      node("step1", { include: "sub", fan_out: { items: "$.items", as: "x" } }),
    ]);

    const result = expandIncludes(parent, map);

    expect(result.issues).toEqual([]);
    expect(result.definition.nodes).toEqual(parent.nodes);
  });
});
