import { describe, expect, it } from "vitest";
import { definitionToGraph, graphToDefinition } from "./serialize";
import type { WorkflowDefinition } from "./schema";

function fixtureDefinition(): WorkflowDefinition {
  return {
    name: "ci-triage",
    nodes: [
      { id: "node-a", prompt: "Summarise the failure." },
      { id: "node-b", bash: "npm test", timeout: 0, depends_on: ["node-a"] },
      {
        id: "node-c",
        command: "propose-fix",
        depends_on: ["node-a", "node-b"],
        when: "${node-b.exit_code} != 0",
        trigger_rule: "all_done",
      },
    ],
  };
}

describe("serialize", () => {
  it("round-trips definition -> graph -> definition", () => {
    const def = fixtureDefinition();
    const { nodes, edges } = definitionToGraph(def);
    const roundTripped = graphToDefinition(nodes, edges, { name: def.name });
    expect(roundTripped).toEqual(def);
  });

  it("zeroes positions on definitionToGraph", () => {
    const { nodes } = definitionToGraph(fixtureDefinition());
    for (const node of nodes) {
      expect(node.position).toEqual({ x: 0, y: 0 });
    }
  });

  it("sets node.type to the registered React Flow node type, not the kind", () => {
    const { nodes } = definitionToGraph(fixtureDefinition());
    for (const node of nodes) {
      expect(node.type).toBe("workflowNode");
    }
  });

  it("derives depends_on strictly from edges, never from node data", () => {
    const def = fixtureDefinition();
    const { nodes, edges } = definitionToGraph(def);
    // Mutating edges must change the derived depends_on on next serialize.
    const filteredEdges = edges.filter((edge) => edge.target !== "node-c");
    const result = graphToDefinition(nodes, filteredEdges, { name: def.name });
    const nodeC = result.nodes.find((node) => node.id === "node-c");
    expect(nodeC?.depends_on).toBeUndefined();
  });

  it("omits depends_on for a root node in graphToDefinition", () => {
    const def = fixtureDefinition();
    const { nodes, edges } = definitionToGraph(def);
    const result = graphToDefinition(nodes, edges, { name: def.name });
    const nodeA = result.nodes.find((node) => node.id === "node-a");
    expect(nodeA?.depends_on).toBeUndefined();
  });

  it("preserves a custom node label through definitionToGraph -> graphToDefinition", () => {
    const def: WorkflowDefinition = {
      name: "labeled",
      nodes: [{ id: "node-a", label: "My custom label", prompt: "Do a thing." }],
    };
    const { nodes, edges } = definitionToGraph(def);
    expect(nodes[0].data.label).toBe("My custom label");
    const roundTripped = graphToDefinition(nodes, edges, { name: def.name });
    expect(roundTripped.nodes[0].label).toBe("My custom label");
  });

  it("omits label when empty/absent, falling back to the kind default in-memory", () => {
    const def: WorkflowDefinition = {
      name: "unlabeled",
      nodes: [{ id: "node-a", prompt: "Do a thing." }],
    };
    const { nodes, edges } = definitionToGraph(def);
    const result = graphToDefinition(nodes, edges, { name: def.name });
    expect(result.nodes[0].label).toBeUndefined();
  });
});
