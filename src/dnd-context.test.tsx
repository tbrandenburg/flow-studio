import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DnDProvider, useDnD } from "./dnd-context";

describe("useDnD", () => {
  it("defaults to null when no kind id has been set", () => {
    const { result } = renderHook(() => useDnD(), { wrapper: DnDProvider });

    const [kindId] = result.current;

    expect(kindId).toBeNull();
  });

  it("shares the dragged node kind id between provider consumers", () => {
    const { result } = renderHook(() => useDnD(), { wrapper: DnDProvider });

    act(() => {
      const [, setKindId] = result.current;
      setKindId("bash");
    });

    const [kindId] = result.current;
    expect(kindId).toBe("bash");
  });
});
