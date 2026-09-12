import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLocalStorage,
  DEFAULT_STORAGE_KEY,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "./persistence";
import type { WorkflowDefinition } from "../workflow/schema";

function fixtureDefinition(): WorkflowDefinition {
  return {
    name: "ci-triage",
    description: "test fixture",
    nodes: [
      { id: "node-a", prompt: "Summarise the failure." },
      { id: "node-b", bash: "npm test", timeout: 0, depends_on: ["node-a"] },
    ],
  };
}

describe("persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a definition through localStorage as YAML", () => {
    const def = fixtureDefinition();
    saveToLocalStorage(def);
    const loaded = loadFromLocalStorage();
    expect(loaded).toEqual(def);
  });

  it("stores YAML text, not raw JSON", () => {
    saveToLocalStorage(fixtureDefinition());
    const raw = window.localStorage.getItem(DEFAULT_STORAGE_KEY);
    expect(raw).toContain("name: ci-triage");
    expect(() => raw && JSON.parse(raw)).toThrow();
  });

  it("returns null when nothing is stored", () => {
    expect(loadFromLocalStorage()).toBeNull();
  });

  it("returns null instead of throwing when stored data is corrupted", () => {
    window.localStorage.setItem(DEFAULT_STORAGE_KEY, "not: [valid, yaml: structure");
    expect(loadFromLocalStorage()).toBeNull();
  });

  it("returns null when stored YAML fails schema validation", () => {
    window.localStorage.setItem(DEFAULT_STORAGE_KEY, "foo: bar");
    expect(loadFromLocalStorage()).toBeNull();
  });

  it("supports custom keys and clearing", () => {
    const key = "flow-studio:other";
    saveToLocalStorage(fixtureDefinition(), key);
    expect(loadFromLocalStorage(key)).not.toBeNull();
    clearLocalStorage(key);
    expect(loadFromLocalStorage(key)).toBeNull();
  });
});
