import { describe, expect, it } from "vitest";
import { isInputTarget } from "./isInputTarget";

describe("isInputTarget", () => {
  it("returns false for null", () => {
    expect(isInputTarget(null)).toBe(false);
  });

  it("returns false for a non-HTMLElement target", () => {
    expect(isInputTarget({} as EventTarget)).toBe(false);
  });

  it("returns true for input, textarea, and select elements", () => {
    expect(isInputTarget(document.createElement("input"))).toBe(true);
    expect(isInputTarget(document.createElement("textarea"))).toBe(true);
    expect(isInputTarget(document.createElement("select"))).toBe(true);
  });

  it("returns false for a plain div", () => {
    expect(isInputTarget(document.createElement("div"))).toBe(false);
  });

  it("returns true for a contentEditable element", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    expect(isInputTarget(div)).toBe(true);
  });

  it("returns true for an element with an editable ARIA role", () => {
    const div = document.createElement("div");
    div.setAttribute("role", "textbox");
    expect(isInputTarget(div)).toBe(true);
  });
});
