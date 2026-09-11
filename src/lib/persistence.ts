import { fromYaml, toYaml, WorkflowYamlError } from "../workflow/yaml";
import type { WorkflowDefinition } from "../workflow/schema";

export const DEFAULT_STORAGE_KEY = "flow-studio:workflow";

/**
 * Serializes the definition to YAML (the same format used for export) and
 * writes it to localStorage, so autosave and file export stay consistent.
 */
export function saveToLocalStorage(def: WorkflowDefinition, key: string = DEFAULT_STORAGE_KEY): void {
  window.localStorage.setItem(key, toYaml(def));
}

/**
 * Reads and parses the YAML previously written by `saveToLocalStorage`.
 * Returns null when there's nothing stored, or when the stored text is
 * missing/corrupted/schema-invalid, so callers can fall back to a seed
 * graph without crashing.
 */
export function loadFromLocalStorage(key: string = DEFAULT_STORAGE_KEY): WorkflowDefinition | null {
  const text = window.localStorage.getItem(key);
  if (!text) return null;
  try {
    return fromYaml(text);
  } catch (cause) {
    if (cause instanceof WorkflowYamlError) return null;
    return null;
  }
}

export function clearLocalStorage(key: string = DEFAULT_STORAGE_KEY): void {
  window.localStorage.removeItem(key);
}
