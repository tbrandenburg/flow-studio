import { Position, ReactFlow, ReactFlowProvider, useNodesState } from "@xyflow/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createLabelNode } from "./LabelNode";

const nodeTypes = {
  input: createLabelNode("input"),
  default: createLabelNode("default"),
  output: createLabelNode("output"),
};

function TestFlow({ type }: { type: "input" | "default" | "output" }) {
  const [nodes, , onNodesChange] = useNodesState([
    { id: "1", type, position: { x: 0, y: 0 }, data: { label: "hello" } },
  ]);

  return (
    <div style={{ width: 800, height: 600 }}>
      <ReactFlow nodes={nodes} onNodesChange={onNodesChange} nodeTypes={nodeTypes} />
    </div>
  );
}

function renderFlow(type: "input" | "default" | "output") {
  return render(<TestFlow type={type} />, { wrapper: ReactFlowProvider });
}

describe("createLabelNode", () => {
  it.each([
    ["input", [], [Position.Bottom]],
    ["default", [Position.Top], [Position.Bottom]],
    ["output", [Position.Top], []],
  ] as const)(
    "renders %s node with matching target/source handles",
    async (type, targets, sources) => {
      const { container } = renderFlow(type);
      await waitFor(() => expect(container.querySelector(".react-flow__node")).not.toBeNull());

      expect(screen.getByText("hello")).toBeInTheDocument();
      expect(container.querySelectorAll(".react-flow__handle.target")).toHaveLength(targets.length);
      expect(container.querySelectorAll(".react-flow__handle.source")).toHaveLength(sources.length);
    },
  );

  it("keeps the edit textarea within the node's bounds (no overflow)", async () => {
    const { container } = renderFlow("default");
    await waitFor(() => expect(container.querySelector(".react-flow__node")).not.toBeNull());

    fireEvent.doubleClick(screen.getByText("hello"));
    const textarea = await screen.findByRole("textbox");
    const node = container.querySelector(".react-flow__node") as HTMLElement;

    const nodeRight = node.getBoundingClientRect().right;
    const textareaRight = textarea.getBoundingClientRect().right;
    expect(textareaRight).toBeLessThanOrEqual(nodeRight);
  });
});
