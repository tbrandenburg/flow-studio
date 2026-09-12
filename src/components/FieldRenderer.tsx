import type { FieldSpec } from "../workflow/kinds";

const inputClass =
  "nodrag w-full rounded border border-[#ddd] px-2 py-1 text-sm text-[#222] focus:border-[#888] focus:outline-none";

function stringListToText(value: unknown): string {
  return Array.isArray(value) ? value.join(", ") : "";
}

function textToStringList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export interface FieldRendererProps {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  if (field.type === "text") {
    return (
      <input
        className={inputClass}
        type="text"
        value={typeof value === "string" ? value : ""}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "textarea") {
    // Non-string values (e.g. loop_group's raw nested `nodes` array) are
    // shown as a best-effort JSON dump for display/summary purposes only;
    // this is not a full structured editor (see issue #10). Edits are
    // passed through as plain strings, which a kind's `toYaml` may choose
    // to ignore if it expects a structured shape.
    const displayValue =
      typeof value === "string" ? value : value === undefined ? "" : JSON.stringify(value, null, 2);
    return (
      <textarea
        className={`${inputClass} min-h-[80px] resize-y${field.mono ? " font-mono" : ""}`}
        value={displayValue}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "number") {
    return (
      <input
        className={inputClass}
        type="number"
        min={field.min}
        max={field.max}
        value={typeof value === "number" ? value : ""}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === "" ? undefined : Number(raw));
        }}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={inputClass}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">-</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className={inputClass}
      type="text"
      defaultValue={stringListToText(value)}
      placeholder={field.placeholder ?? "comma, separated, values"}
      onBlur={(event) => onChange(textToStringList(event.target.value))}
    />
  );
}
