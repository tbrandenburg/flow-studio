import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NodeKindBadge } from "./NodeKindBadge";
import type { NodeKind } from "../workflow/kinds/types";

const kind: NodeKind = {
  id: "bash",
  badge: "BASH",
  description: "Run a shell command",
  accentVar: "--accent-bash",
  fields: [],
  preview: () => "",
  toYaml: () => ({}),
  fromYaml: () => null,
  schema: {} as NodeKind["schema"],
};

describe("NodeKindBadge", () => {
  it("renders the kind's badge text", () => {
    render(<NodeKindBadge kind={kind} />);
    expect(screen.getByText("BASH")).toBeInTheDocument();
  });

  it("applies the accent color from the kind's accentVar", () => {
    render(<NodeKindBadge kind={kind} />);
    const badge = screen.getByText("BASH");
    expect(badge.style.backgroundColor).toBe("var(--accent-bash)");
  });

  it("merges an optional className with the default classes", () => {
    render(<NodeKindBadge kind={kind} className="mb-1 block" />);
    const badge = screen.getByText("BASH");
    expect(badge.className).toContain("mb-1 block");
    expect(badge.className).toContain("rounded");
  });
});
