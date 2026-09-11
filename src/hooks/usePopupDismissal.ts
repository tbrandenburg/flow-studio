import { useEffect, type RefObject } from "react";

/**
 * Dismisses an open popup on Escape, on mousedown outside its container, or
 * on a new contextmenu event outside its container. All listeners are
 * registered in the capture phase so they run before React Flow's own
 * handlers, some of which call stopPropagation and would otherwise prevent
 * a bubble-phase document listener from ever firing.
 */
export function usePopupDismissal(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!open) return;

    function isOutside(target: EventTarget | null): boolean {
      const container = containerRef.current;
      if (!container) return true;
      return !(target instanceof Node) || !container.contains(target);
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onDismiss();
    }

    function onPointerDown(event: MouseEvent): void {
      if (isOutside(event.target)) onDismiss();
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("contextmenu", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("contextmenu", onPointerDown, true);
    };
  }, [open, containerRef, onDismiss]);
}
