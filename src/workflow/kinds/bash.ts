import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

const schema = z.object({
  script: z.string().min(1),
  timeout: z.number().min(0).optional(),
});

export const bashKind: NodeKind = {
  id: "bash",
  badge: "BASH",
  description: "Run a shell script",
  accentVar: "--color-node-bash",
  fields: [
    { name: "script", label: "Script", type: "textarea", required: true, mono: true },
    { name: "timeout", label: "Timeout (ms)", type: "number", min: 0 },
  ],
  preview: (data) => (typeof data.script === "string" ? data.script.split("\n")[0] : ""),
  toYaml: (data) => ({
    bash: data.script as string,
    ...(data.timeout !== undefined && data.timeout !== null
      ? { timeout: Number(data.timeout) }
      : {}),
  }),
  fromYaml: (raw) => {
    if (typeof raw.bash !== "string") return null;
    return {
      kind: "bash",
      label: "Shell",
      script: raw.bash,
      timeout: raw.timeout as number | undefined,
    };
  },
  schema,
};

export type BashNodeData = WorkflowNodeData & z.infer<typeof schema>;
