import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DnDProvider, useDnD } from "./dnd-context";

describe("useDnD", () => {
  it("defaults to null when no type has been set", () => {
    const { result } = renderHook(() => useDnD(), { wrapper: DnDProvider });

    const [type] = result.current;

    expect(type).toBeNull();
  });

  it("shares the dragged node type between provider consumers", () => {
    const { result } = renderHook(() => useDnD(), { wrapper: DnDProvider });

    act(() => {
      const [, setType] = result.current;
      setType("position-logger");
    });

    const [type] = result.current;
    expect(type).toBe("position-logger");
  });
});
