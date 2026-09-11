export type YamlViewMode = "hidden" | "split" | "full";

interface YamlCodeViewProps {
  mode: YamlViewMode;
  yaml: string;
}

/**
 * Read-only YAML preview. There is no bidirectional editing in this PR:
 * the text is rendered in a plain <pre>/<code> block that is never
 * focusable or editable, so typing (if the element could even receive
 * focus) can never mutate the graph.
 */
export function YamlCodeView({ mode, yaml }: YamlCodeViewProps) {
  if (mode === "hidden") return null;

  const containerClass =
    mode === "full"
      ? "absolute inset-0 z-10 bg-white overflow-auto"
      : "h-full w-[380px] shrink-0 overflow-auto border-l border-[#ddd] bg-white";

  return (
    <div className={containerClass} aria-label="Workflow YAML preview">
      <pre className="m-0 p-3 text-xs leading-relaxed whitespace-pre-wrap">
        <code>{yaml}</code>
      </pre>
    </div>
  );
}
