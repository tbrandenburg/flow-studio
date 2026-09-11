import { describe, expect, it } from "vitest";
import type { Edge } from "@xyflow/react";
import { computeGraphIssues, computeInstantIssues } from "../workflow/validate";
import type { WorkflowFlowNode } from "../workflow/types";

function makeBashNode(id: string, script: string): WorkflowFlowNode {
  return {
    id,
    type: "workflowNode",
    position: { x: 0, y: 0 },
    data: { id, kind: "bash", label: id, script },
  };
}

function makePromptNode(id: string): WorkflowFlowNode {
  return {
    id,
    type: "workflowNode",
    position: { x: 0, y: 0 },
    data: { id, kind: "prompt", label: id, prompt: "hi" },
  };
}

function edge(source: string, target: string): Edge {
  return { id: `${source}->${target}`, source, target };
}

describe("computeInstantIssues", () => {
  it("flags an empty bash script as an error", () => {
    const nodes = [makeBashNode("b1", "")];
    const issues = computeInstantIssues(nodes);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("error");
    expect(issues[0]?.nodeId).toBe("b1");
  });

  it("has no issues for a valid bash node", () => {
    const nodes = [makeBashNode("b1", "npm test")];
    expect(computeInstantIssues(nodes)).toHaveLength(0);
  });
});

describe("computeGraphIssues", () => {
  it("detects a cycle", () => {
    const nodes = [makePromptNode("a"), makePromptNode("b")];
    const edges = [edge("a", "b"), edge("b", "a")];
    const issues = computeGraphIssues(nodes, edges);
    expect(issues.some((issue) => issue.id === "cycle")).toBe(true);
  });

  it("detects a self-loop as a distinct category from cycle", () => {
    const nodes = [makePromptNode("a"), makePromptNode("b")];
    const edges = [edge("a", "b"), edge("a", "a")];
    const issues = computeGraphIssues(nodes, edges);
    expect(issues.some((issue) => issue.id.startsWith("self-loop:"))).toBe(true);
  });

  it("detects duplicate node ids", () => {
    const nodes = [makePromptNode("a"), makePromptNode("a")];
    const issues = computeGraphIssues(nodes, []);
    expect(issues.some((issue) => issue.id === "duplicate:a")).toBe(true);
  });

  it("detects dangling edges", () => {
    const nodes = [makePromptNode("a")];
    const edges = [edge("a", "ghost")];
    const issues = computeGraphIssues(nodes, edges);
    expect(issues.some((issue) => issue.id.startsWith("dangling:"))).toBe(true);
  });

  it("flags a disconnected node as an orphan when there is more than one node", () => {
    const nodes = [makePromptNode("a"), makePromptNode("b"), makePromptNode("c")];
    const edges = [edge("a", "b")];
    const issues = computeGraphIssues(nodes, edges);
    expect(issues.some((issue) => issue.id === "orphan:c")).toBe(true);
    expect(issues.some((issue) => issue.id === "orphan:a")).toBe(false);
  });

  it("reports no issues for a valid, connected, acyclic graph", () => {
    const nodes = [makePromptNode("a"), makePromptNode("b")];
    const edges = [edge("a", "b")];
    expect(computeGraphIssues(nodes, edges)).toHaveLength(0);
  });
});
