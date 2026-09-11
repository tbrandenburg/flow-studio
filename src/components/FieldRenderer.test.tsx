import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FieldRenderer } from "./FieldRenderer";
import type { FieldSpec } from "../workflow/kinds";

describe("FieldRenderer", () => {
  it("renders a text input and calls onChange", () => {
    const field: FieldSpec = { name: "label", label: "Label", type: "text" };
    const onChange = vi.fn();
    render(<FieldRenderer field={field} value="hi" onChange={onChange} />);
    const input = screen.getByDisplayValue("hi");
    fireEvent.change(input, { target: { value: "bye" } });
    expect(onChange).toHaveBeenCalledWith("bye");
  });

  it("renders a textarea with mono font when field.mono is set", () => {
    const field: FieldSpec = { name: "script", label: "Script", type: "textarea", mono: true };
    const onChange = vi.fn();
    render(<FieldRenderer field={field} value="echo hi" onChange={onChange} />);
    const textarea = screen.getByDisplayValue("echo hi");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.className).toContain("font-mono");
    fireEvent.change(textarea, { target: { value: "echo bye" } });
    expect(onChange).toHaveBeenCalledWith("echo bye");
  });

  it("renders a number input respecting min/max and calls onChange with a number", () => {
    const field: FieldSpec = { name: "timeout", label: "Timeout", type: "number", min: 0, max: 100 };
    const onChange = vi.fn();
    render(<FieldRenderer field={field} value={5} onChange={onChange} />);
    const input = screen.getByDisplayValue("5") as HTMLInputElement;
    expect(input.min).toBe("0");
    expect(input.max).toBe("100");
    fireEvent.change(input, { target: { value: "42" } });
    expect(onChange).toHaveBeenCalledWith(42);
  });

  it("renders a select with options and calls onChange", () => {
    const field: FieldSpec = {
      name: "trigger_rule",
      label: "Trigger rule",
      type: "select",
      options: ["all_success", "all_done"],
    };
    const onChange = vi.fn();
    render(<FieldRenderer field={field} value="all_success" onChange={onChange} />);
    const select = screen.getByDisplayValue("all_success");
    fireEvent.change(select, { target: { value: "all_done" } });
    expect(onChange).toHaveBeenCalledWith("all_done");
  });

  it("renders a stringList input parsing comma-separated values on blur", () => {
    const field: FieldSpec = { name: "allowed_tools", label: "Allowed tools", type: "stringList" };
    const onChange = vi.fn();
    render(<FieldRenderer field={field} value={["a", "b"]} onChange={onChange} />);
    const input = screen.getByDisplayValue("a, b");
    fireEvent.change(input, { target: { value: "x, y, z" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(["x", "y", "z"]);
  });
});
