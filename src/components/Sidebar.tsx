import { cn } from "../lib/utils";
import { useDnD } from "../dnd-context";
import { NODE_KINDS } from "../workflow/kinds";
import { NodeKindBadge } from "./NodeKindBadge";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [, setKindId] = useDnD();

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, kindId: string) => {
    setKindId(kindId);
    event.dataTransfer.setData("application/reactflow", kindId);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      className={cn(
        "box-border w-[200px] shrink-0 overflow-y-auto border-r border-[#eee] bg-[#fafafa] p-3",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:right-[25%] max-md:z-10",
        "max-md:-translate-x-full max-md:shadow-[2px_0_8px_rgba(0,0,0,0.15)] max-md:transition-transform max-md:duration-200 max-md:ease-in-out",
        open && "max-md:translate-x-0",
      )}
    >
      <div className="mb-2 flex items-center justify-between font-semibold">
        <span>Nodes</span>
        <button
          className="hidden cursor-pointer border-none bg-transparent text-xl leading-none max-md:block"
          onClick={onClose}
          aria-label="Close palette"
        >
          ×
        </button>
      </div>
      <div className="mb-3 text-xs text-[#666]">Drag a node onto the canvas.</div>
      {NODE_KINDS.map((kind) => (
        <div
          key={kind.id}
          className="mb-2 cursor-grab rounded border border-[#ddd] bg-white px-2.5 py-2 text-[13px] active:cursor-grabbing"
          draggable
          onDragStart={(event) => onDragStart(event, kind.id)}
        >
          <NodeKindBadge kind={kind} className="mb-1 block" />
          <div className="text-[#666]">{kind.description}</div>
        </div>
      ))}
    </aside>
  );
}
