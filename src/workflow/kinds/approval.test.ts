import { describe, expect, it } from "vitest";
import { approvalKind } from "./approval";

describe("approvalKind.fromYaml", () => {
  it("returns null when approval key is missing", () => {
    expect(approvalKind.fromYaml({})).toBeNull();
  });

  it("parses capture_response", () => {
    const result = approvalKind.fromYaml({
      approval: { message: "ok?", capture_response: true },
    });
    expect(result).toMatchObject({ message: "ok?", capture_response: true });
  });
});

describe("approvalKind.toYaml", () => {
  it("round-trips capture_response", () => {
    const raw = { approval: { message: "ok?", capture_response: true } };
    const parsed = approvalKind.fromYaml(raw);
    expect(parsed).not.toBeNull();
    const yaml = approvalKind.toYaml({
      id: "n1",
      kind: "approval",
      label: "Approval",
      ...parsed,
    } as never);
    expect(yaml).toEqual(raw);
  });
});
