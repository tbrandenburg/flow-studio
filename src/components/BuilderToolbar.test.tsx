import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BuilderToolbar } from "./BuilderToolbar";

function renderToolbar(overrides: Partial<Parameters<typeof BuilderToolbar>[0]> = {}) {
  const props = {
    workflowName: "my-workflow",
    workflowDescription: "desc",
    onNameChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    yamlViewMode: "hidden" as const,
    onYamlViewModeChange: vi.fn(),
    hasUnsavedChanges: false,
    onNew: vi.fn(),
    onExport: vi.fn(),
    onImportFile: vi.fn(),
    onAutoLayout: vi.fn(),
    importError: null,
    colorMode: "system" as const,
    onColorModeChange: vi.fn(),
    ...overrides,
  };
  render(<BuilderToolbar {...props} />);
  return props;
}

describe("BuilderToolbar", () => {
  it("renders the color mode select with the current value", () => {
    renderToolbar({ colorMode: "dark" });
    const select = screen.getByLabelText("Color mode") as HTMLSelectElement;
    expect(select.value).toBe("dark");
  });

  it("calls onColorModeChange when the color mode select changes", () => {
    const props = renderToolbar();
    const select = screen.getByLabelText("Color mode");
    fireEvent.change(select, { target: { value: "dark" } });
    expect(props.onColorModeChange).toHaveBeenCalledWith("dark");
  });

  it("lists light, dark, and system options", () => {
    renderToolbar();
    const select = screen.getByLabelText("Color mode") as HTMLSelectElement;
    const values = Array.from(select.options).map((option) => option.value);
    expect(values).toEqual(["light", "dark", "system"]);
  });
});
