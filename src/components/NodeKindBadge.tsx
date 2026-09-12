import type { NodeKind } from "../workflow/kinds/types";

interface NodeKindBadgeProps {
  kind: NodeKind;
  className?: string;
}

export function NodeKindBadge({ kind, className = "" }: NodeKindBadgeProps) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white ${className}`}
      style={{ backgroundColor: `var(${kind.accentVar})` }}
    >
      {kind.badge}
    </span>
  );
}
