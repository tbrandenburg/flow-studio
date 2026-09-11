import { describe, expect, it } from "vitest";
import { isDoubleClick } from "./doubleClick";

describe("isDoubleClick", () => {
  it("returns false when there is no previous click", () => {
    expect(isDoubleClick(null, { x: 0, y: 0, time: 0 })).toBe(false);
  });

  it("returns true for a fast, close second click", () => {
    const prev = { x: 100, y: 100, time: 1000 };
    const next = { x: 103, y: 104, time: 1200 };
    expect(isDoubleClick(prev, next)).toBe(true);
  });

  it("returns false when the second click is too slow", () => {
    const prev = { x: 100, y: 100, time: 1000 };
    const next = { x: 100, y: 100, time: 1400 };
    expect(isDoubleClick(prev, next)).toBe(false);
  });

  it("returns false when the second click is too far away", () => {
    const prev = { x: 100, y: 100, time: 1000 };
    const next = { x: 150, y: 100, time: 1100 };
    expect(isDoubleClick(prev, next)).toBe(false);
  });

  it("respects custom thresholds", () => {
    const prev = { x: 0, y: 0, time: 0 };
    const next = { x: 20, y: 0, time: 50 };
    expect(isDoubleClick(prev, next, 300, 30)).toBe(true);
    expect(isDoubleClick(prev, next, 300, 10)).toBe(false);
  });
});
