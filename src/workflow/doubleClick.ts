export interface ClickPoint {
  x: number;
  y: number;
  time: number;
}

/**
 * Pure detection of whether two consecutive pane clicks constitute a
 * double-click: the second click must arrive within `thresholdMs` of the
 * first and within `thresholdPx` of its position.
 */
export function isDoubleClick(
  prev: ClickPoint | null,
  next: ClickPoint,
  thresholdMs = 300,
  thresholdPx = 10,
): boolean {
  if (!prev) return false;
  const dt = next.time - prev.time;
  if (dt < 0 || dt > thresholdMs) return false;
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  return Math.sqrt(dx * dx + dy * dy) <= thresholdPx;
}
