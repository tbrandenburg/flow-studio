import { z } from "zod";
import type { WorkflowNodeData } from "../types";
import type { NodeKind } from "./types";

// Fields already handled generically by serialize.ts (common to every node)
// and therefore excluded from the stored `raw` payload to avoid duplicating
// them on round-trip.
const COMMON_FIELDS = ["id", "depends_on", "label", "when", "trigger_rule"] as const;

const schema = z.object({
  raw: z.record(z.string(), z.unknown()).optional(),
});

function stripCommonFields(raw: Record<string, unknown>): Record<string, unknown> {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if ((COMMON_FIELDS as readonly string[]).includes(key)) continue;
    rest[key] = value;
  }
  return rest;
}

export const unknownKind: NodeKind = {
  id: "unknown",
  badge: "UNKNOWN",
  description: "Unsupported node kind (raw passthrough)",
  accentVar: "--color-node-unknown",
  fields: [],
  preview: (data) => {
    const raw = data.raw;
    if (typeof raw !== "object" || raw === null) return "";
    const keys = Object.keys(raw);
    return keys.length > 0 ? `unrecognized: ${keys.join(", ")}` : "unrecognized node";
  },
  toYaml: (data) => {
    const raw = data.raw;
    return typeof raw === "object" && raw !== null ? { ...(raw as Record<string, unknown>) } : {};
  },
  // Always matches: this is the catch-all fallback and must be registered
  // last in NODE_KINDS so every other kind gets first refusal.
  fromYaml: (raw) => ({
    kind: "unknown",
    label: "Unknown",
    raw: stripCommonFields(raw),
  }),
  schema,
};

export type UnknownNodeData = WorkflowNodeData & z.infer<typeof schema>;
