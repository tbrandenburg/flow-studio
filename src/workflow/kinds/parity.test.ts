/**
 * Parity guard (#32): mechanically diffs flow-studio's hand-rolled kind
 * schemas against a checked-in, hand-extracted snapshot of Archon's real
 * dag-node schema shape (`__parity__/*.parity.json`), instead of vendoring
 * Archon's schema via submodule (#12/#9 concluded that's not worth it).
 *
 * Each fixture is a small, explicit, reviewable list of the fields
 * flow-studio's kind currently claims to support, with the required/optional
 * + basic-type shape Archon's real schema uses for the same field (see each
 * fixture's `archonSource` comment for where in Archon that was read from).
 *
 * This guards against three drift classes going forward:
 *   - flow-studio inventing a field Archon doesn't have
 *   - flow-studio silently losing a field it used to support
 *   - a shared field's required/optional-ness disagreeing
 *
 * It does NOT assert flow-studio implements every field Archon's real schema
 * has — several kinds (`command`, `prompt`, `loop`) are deliberately partial
 * ports; the gaps are documented in each kind file's own comments and in the
 * parity fixtures' `archonSource` notes, not re-litigated here.
 *
 * When Archon's schema changes and a manual audit is re-run, update the
 * corresponding `*.parity.json` fixture in the same PR as the fix.
 */
import { describe, expect, it } from "vitest";
import type { ZodTypeAny } from "zod";
import { approvalKind } from "./approval";
import { bashKind } from "./bash";
import { commandKind } from "./command";
import { includeKind } from "./include";
import { loopKind } from "./loop";
import { promptKind } from "./prompt";
import { scriptKind } from "./script";
import { waitKind } from "./wait";
import type { NodeKind } from "./types";
import approvalFixture from "./__parity__/approval.parity.json";
import bashFixture from "./__parity__/bash.parity.json";
import commandFixture from "./__parity__/command.parity.json";
import includeFixture from "./__parity__/include.parity.json";
import loopFixture from "./__parity__/loop.parity.json";
import promptFixture from "./__parity__/prompt.parity.json";
import scriptFixture from "./__parity__/script.parity.json";
import waitFixture from "./__parity__/wait.parity.json";

interface ParityField {
  name: string;
  optional: boolean;
  type: string;
  values?: readonly string[];
}

interface ParityFixture {
  kind: string;
  archonSource: string;
  fields: readonly ParityField[];
}

const CASES: readonly { kind: NodeKind; fixture: ParityFixture }[] = [
  { kind: promptKind, fixture: promptFixture },
  { kind: scriptKind, fixture: scriptFixture },
  { kind: bashKind, fixture: bashFixture },
  { kind: commandKind, fixture: commandFixture },
  { kind: waitKind, fixture: waitFixture },
  { kind: loopKind, fixture: loopFixture },
  { kind: approvalKind, fixture: approvalFixture },
  { kind: includeKind, fixture: includeFixture },
];

/** Unwraps a (possibly optional) zod schema to its base type name (zod v4 `_def`/`def`.type). */
function baseTypeOf(field: ZodTypeAny): { type: string; optional: boolean } {
  const def = (field as unknown as { def: { type: string; innerType?: ZodTypeAny } }).def;
  if (def.type === "optional" && def.innerType) {
    const inner = baseTypeOf(def.innerType);
    return { type: inner.type, optional: true };
  }
  return { type: def.type, optional: false };
}

function enumValuesOf(field: ZodTypeAny): string[] | undefined {
  const def = (field as unknown as { def: { type: string; innerType?: ZodTypeAny } }).def;
  if (def.type === "optional" && def.innerType) return enumValuesOf(def.innerType);
  if (def.type === "enum") {
    const entries = (def as unknown as { entries: Record<string, string> }).entries;
    return Object.values(entries);
  }
  return undefined;
}

describe("kind schema parity guard (#32)", () => {
  for (const { kind, fixture } of CASES) {
    describe(`${kind.id} vs Archon fixture (${fixture.archonSource})`, () => {
      const shape = (kind.schema as unknown as { shape: Record<string, ZodTypeAny> }).shape;

      it("has exactly the fixture's field names (no invented, no missing)", () => {
        expect(Object.keys(shape).sort()).toEqual(fixture.fields.map((f) => f.name).sort());
      });

      for (const field of fixture.fields) {
        it(`field '${field.name}' matches fixture shape`, () => {
          const zodField = shape[field.name];
          expect(zodField, `expected schema to declare field '${field.name}'`).toBeDefined();
          const { type, optional } = baseTypeOf(zodField);
          expect(optional).toBe(field.optional);
          expect(type).toBe(field.type);
          if (field.values) {
            expect(enumValuesOf(zodField)).toEqual([...field.values]);
          }
        });
      }
    });
  }
});
