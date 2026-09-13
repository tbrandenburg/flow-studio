import { useRef, type ChangeEvent } from "react";
import type { ColorMode } from "@xyflow/react";
import type { YamlViewMode } from "./YamlCodeView";

interface BuilderToolbarProps {
  workflowName: string;
  workflowDescription: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  yamlViewMode: YamlViewMode;
  onYamlViewModeChange: (mode: YamlViewMode) => void;
  hasUnsavedChanges: boolean;
  onNew: () => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  onAutoLayout: () => void;
  importError: string | null;
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
}

const VIEW_MODES: YamlViewMode[] = ["hidden", "split", "full"];
const COLOR_MODES: ColorMode[] = ["light", "dark", "system"];

export function BuilderToolbar({
  workflowName,
  workflowDescription,
  onNameChange,
  onDescriptionChange,
  yamlViewMode,
  onYamlViewModeChange,
  hasUnsavedChanges,
  onNew,
  onExport,
  onImportFile,
  onAutoLayout,
  importError,
  colorMode,
  onColorModeChange,
}: BuilderToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onImportFile(file);
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <input
          className="w-40 rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm text-text-primary"
          value={workflowName}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="workflow name"
          aria-label="Workflow name"
        />
        <input
          className="w-52 rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm text-text-primary"
          value={workflowDescription}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="description"
          aria-label="Workflow description"
        />
        {hasUnsavedChanges ? (
          <span className="rounded border border-border bg-surface-elevated px-2.5 py-1.5 text-sm text-text-secondary">
            ● Unsaved changes
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="cursor-pointer rounded border border-border bg-surface-elevated px-2.5 py-1.5"
          onClick={onNew}
        >
          New
        </button>
        <button
          className="cursor-pointer rounded border border-border bg-surface-elevated px-2.5 py-1.5"
          onClick={() => fileInputRef.current?.click()}
        >
          Import .yaml
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml"
          className="hidden"
          onChange={onFileChange}
          aria-label="Import workflow YAML file"
        />
        <button
          className="cursor-pointer rounded border border-border bg-surface-elevated px-2.5 py-1.5"
          onClick={onExport}
        >
          Export .yaml
        </button>
        <button
          className="cursor-pointer rounded border border-border bg-surface-elevated px-2.5 py-1.5"
          onClick={onAutoLayout}
        >
          Auto-layout
        </button>
        <select
          className="cursor-pointer rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm"
          value={yamlViewMode}
          onChange={(event) => onYamlViewModeChange(event.target.value as YamlViewMode)}
          aria-label="YAML view mode"
        >
          {VIEW_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
        <select
          className="cursor-pointer rounded border border-border bg-surface-elevated px-2 py-1.5 text-sm"
          value={colorMode}
          onChange={(event) => onColorModeChange(event.target.value as ColorMode)}
          aria-label="Color mode"
        >
          {COLOR_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>
      {importError ? (
        <span className="max-w-xs rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-sm text-red-700">
          {importError}
        </span>
      ) : null}
    </div>
  );
}
