import { Position, ReactFlowProvider, type NodeProps } from "@xyflow/react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PositionLoggerNode } from "./PositionLoggerNode";
import type { PositionLoggerNode as PositionLoggerNodeType } from "./types";

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
});
