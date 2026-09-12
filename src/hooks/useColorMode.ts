import { useCallback, useEffect, useState } from "react";
import type { ColorMode } from "@xyflow/react";

const STORAGE_KEY = "flow-studio:color-mode";

function readStoredMode(): ColorMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyColorMode(mode: ColorMode): void {
  const isDark = mode === "dark" || (mode === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

/**
 * Manages the app's color mode (light/dark/system), persisting the user's
 * choice to localStorage and reflecting it as a `.dark` class on the root
 * element so both Tailwind's `dark:` variant and React Flow's own
 * `colorMode` prop stay in sync. See React Flow's Dark Mode example:
 * https://reactflow.dev/examples/styling/dark-mode
 */
export function useColorMode(): {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
} {
  const [colorMode, setColorModeState] = useState<ColorMode>(readStoredMode);

  const setColorMode = useCallback((mode: ColorMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setColorModeState(mode);
  }, []);

  useEffect(() => {
    applyColorMode(colorMode);
    if (colorMode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyColorMode("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [colorMode]);

  return { colorMode, setColorMode };
}
