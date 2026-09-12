import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useColorMode } from "./useColorMode";

const STORAGE_KEY = "flow-studio:color-mode";

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: "(prefers-color-scheme: dark)",
    addEventListener: vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
  } as unknown as MediaQueryList;

  window.matchMedia = vi.fn().mockReturnValue(mql);
  return { mql, listeners };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useColorMode", () => {
  it("falls back to system mode and applies the OS preference when nothing is stored", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useColorMode());

    expect(result.current.colorMode).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("reads a previously persisted mode from localStorage", () => {
    mockMatchMedia(false);
    localStorage.setItem(STORAGE_KEY, "dark");

    const { result } = renderHook(() => useColorMode());

    expect(result.current.colorMode).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists a new mode to localStorage and toggles the root class", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useColorMode());

    act(() => {
      result.current.setColorMode("dark");
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      result.current.setColorMode("light");
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("subscribes to the media query only while in system mode and cleans up on unmount", () => {
    const { mql } = mockMatchMedia(false);
    localStorage.setItem(STORAGE_KEY, "system");

    const { unmount } = renderHook(() => useColorMode());
    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("does not subscribe to the media query when an explicit mode is set", () => {
    const { mql } = mockMatchMedia(false);
    localStorage.setItem(STORAGE_KEY, "light");

    renderHook(() => useColorMode());

    expect(mql.addEventListener).not.toHaveBeenCalled();
  });
});
