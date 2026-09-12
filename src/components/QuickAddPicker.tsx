import { useRef } from "react";
import { NODE_KINDS } from "../workflow/kinds";
import { usePopupDismissal } from "../hooks/usePopupDismissal";
import { NodeKindBadge } from "./NodeKindBadge";

export interface QuickAddPickerProps {
  position: { x: number; y: number };
  onPick: (kindId: string) => void;
  onDismiss: () => void;
}

const MENU_WIDTH = 220;
const MENU_HEIGHT_ESTIMATE = 260;

function clamp(value: number, max: number): number {
  return Math.max(4, Math.min(value, max));
}

export function QuickAddPicker({ position, onPick, onDismiss }: QuickAddPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  usePopupDismissal(true, ref, onDismiss);

  const left = clamp(position.x, window.innerWidth - MENU_WIDTH - 4);
  const top = clamp(position.y, window.innerHeight - MENU_HEIGHT_ESTIMATE - 4);

  return (
    <div
      ref={ref}
      className="absolute z-20 w-[220px] rounded-md border border-border bg-surface-elevated p-1 shadow-lg"
      style={{ left, top }}
      role="menu"
      aria-label="Add node"
    >
      {NODE_KINDS.map((kind) => (
        <button
          key={kind.id}
          role="menuitem"
          className="block w-full cursor-pointer rounded px-2 py-1.5 text-left text-[13px] hover:bg-surface-elevated"
          onClick={() => onPick(kind.id)}
        >
          <NodeKindBadge kind={kind} className="mr-1.5" />
          <span className="text-text-secondary">{kind.description}</span>
        </button>
      ))}
    </div>
  );
}
