import { useDnD } from "../dnd-context";
import "./Sidebar.css";

const PALETTE = [
  { type: "input", label: "Input node" },
  { type: "default", label: "Default node" },
  { type: "output", label: "Output node" },
  { type: "position-logger", label: "Position logger" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const [, setType] = useDnD();

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    setType(nodeType);
    event.dataTransfer.setData("text/plain", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className={`palette ${open ? "palette--open" : ""}`}>
      <div className="palette__header">
        <span>Nodes</span>
        <button className="palette__close" onClick={onClose} aria-label="Close palette">
          ×
        </button>
      </div>
      <div className="palette__description">Drag a node onto the canvas.</div>
      {PALETTE.map((item) => (
        <div
          key={item.type}
          className="palette__item"
          draggable
          onDragStart={(event) => onDragStart(event, item.type)}
        >
          {item.label}
        </div>
      ))}
    </aside>
  );
}
