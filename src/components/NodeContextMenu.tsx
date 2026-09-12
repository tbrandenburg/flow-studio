import { useRef } from "react";
import { Copy, Trash2 } from "lucide-react";
import { usePopupDismissal } from "../hooks/usePopupDismissal";

export interface NodeContextMenuProps {
  position: { x: number; y: number };
  onDelete: () => void;
  onDuplicate: () => void;
  onDismiss: () => void;
}

const MENU_WIDTH = 140;
const MENU_HEIGHT = 84;

function clamp(value: number, max: number): number {
  return Math.max(4, Math.min(value, max));
}

export function NodeContextMenu({
  position,
  onDelete,
  onDuplicate,
  onDismiss,
}: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  usePopupDismissal(true, ref, onDismiss);

  const left = clamp(position.x, window.innerWidth - MENU_WIDTH - 4);
  const top = clamp(position.y, window.innerHeight - MENU_HEIGHT - 4);

  return (
    <div
      ref={ref}
      className="absolute z-20 w-[140px] rounded-md border border-border bg-surface-elevated p-1 shadow-lg"
      style={{ left, top }}
      role="menu"
      aria-label="Node actions"
    >
      <button
        role="menuitem"
        className="flex w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-left text-[13px] hover:bg-surface-elevated"
        onClick={onDuplicate}
      >
        <Copy size={14} />
        Duplicate
      </button>
      <button
        role="menuitem"
        className="flex w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-left text-[13px] text-red-600 hover:bg-surface-elevated"
        onClick={onDelete}
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );
}
