import {
  ReactFlow,
  Position,
  ReactFlowProvider,
  useNodesState,
  type NodeProps,
} from "@xyflow/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PositionLoggerNode } from "./PositionLoggerNode";
import type { PositionLoggerNode as PositionLoggerNodeType } from "./types";

const nodeTypes = { "position-logger": PositionLoggerNode };

function TestFlow({ label }: { label: string }) {
  const [nodes, , onNodesChange] = useNodesState([
    { id: "1", type: "position-logger", position: { x: 0, y: 0 }, data: { label } },
  ]);

  return (
    <div style={{ width: 800, height: 600 }}>
      <ReactFlow nodes={nodes} onNodesChange={onNodesChange} nodeTypes={nodeTypes} />
    </div>
  );
}

function renderFlow(label: string) {
  return render(<TestFlow label={label} />, { wrapper: ReactFlowProvider });
}

function buildProps(
  overrides: Partial<NodeProps<PositionLoggerNodeType>> = {},
): NodeProps<PositionLoggerNodeType> {
  return {
    id: "1",
    type: "position-logger",
    data: { label: "drag me!" },
    selected: false,
    dragging: false,
    isConnectable: true,
    zIndex: 0,
    positionAbsoluteX: 12.4,
    positionAbsoluteY: 87.6,
    ...overrides,
  } as NodeProps<PositionLoggerNodeType>;
}

describe("PositionLoggerNode", () => {
  it("renders the node label and rounded absolute position", () => {
    render(<PositionLoggerNode {...buildProps()} />, { wrapper: ReactFlowProvider });

    expect(screen.getByText("drag me!")).toBeInTheDocument();
    expect(screen.getByText("12px 88px")).toBeInTheDocument();
  });

  it("renders a source handle so the node can be connected", () => {
    const { container } = render(<PositionLoggerNode {...buildProps()} />, {
      wrapper: ReactFlowProvider,
    });

    const handle = container.querySelector(".react-flow__handle");
    expect(handle).not.toBeNull();
    expect(handle).toHaveClass(`react-flow__handle-${Position.Bottom}`);
  });

  it("commits the edited label on Enter and exits edit mode", async () => {
    const { container } = renderFlow("old");
    await waitFor(() => expect(container.querySelector(".react-flow__node")).not.toBeNull());

    fireEvent.doubleClick(screen.getByText("old"));
    const textarea = await screen.findByRole("textbox");
    fireEvent.change(textarea, { target: { value: "new label" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("new label")).toBeInTheDocument();
  });

  it("inserts a newline instead of committing on Shift+Enter", async () => {
    const { container } = renderFlow("old");
    await waitFor(() => expect(container.querySelector(".react-flow__node")).not.toBeNull());

    fireEvent.doubleClick(screen.getByText("old"));
    const textarea = (await screen.findByRole("textbox")) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "line1\nline2" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(textarea.value).toBe("line1\nline2");
  });
});
