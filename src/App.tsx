import { ReactFlowProvider } from "@xyflow/react";

import { DnDProvider } from "./dnd-context";
import { WorkflowBuilder } from "./components/WorkflowBuilder";

function App() {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <WorkflowBuilder />
      </DnDProvider>
    </ReactFlowProvider>
  );
}

export default App;
