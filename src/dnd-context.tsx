import { createContext, useContext, useState, type ReactNode } from "react";

// Carries the dragged node kind id (e.g. "bash", "prompt") from the palette
// to the canvas drop handler.
type DnDContextValue = [string | null, (kindId: string | null) => void];

const DnDContext = createContext<DnDContextValue>([null, () => {}]);

export function DnDProvider({ children }: { children: ReactNode }) {
  const [kindId, setKindId] = useState<string | null>(null);

  return <DnDContext.Provider value={[kindId, setKindId]}>{children}</DnDContext.Provider>;
}

export function useDnD() {
  return useContext(DnDContext);
}
