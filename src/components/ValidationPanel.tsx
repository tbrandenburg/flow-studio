import type { ValidationIssue } from "../workflow/validate";

export interface ValidationPanelProps {
  issues: readonly ValidationIssue[];
  onIssueClick: (issue: ValidationIssue) => void;
}

const SEVERITY_ORDER: Record<ValidationIssue["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

const SEVERITY_ICON: Record<ValidationIssue["severity"], string> = {
  error: "●",
  warning: "▲",
  info: "ℹ",
};

const SEVERITY_COLOR: Record<ValidationIssue["severity"], string> = {
  error: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

/**
 * Client-side validation issue list, always visible when there is at least
 * one issue. Sorted error -> warning -> info. Clicking an issue that is
 * attributed to a node selects and centers that node on the canvas.
 */
export function ValidationPanel({ issues, onIssueClick }: ValidationPanelProps) {
  if (issues.length === 0) return null;

  const sorted = [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <div
      className="absolute bottom-2 left-2 z-[5] max-h-[240px] w-[320px] overflow-y-auto rounded-md border border-border bg-surface-elevated shadow-lg"
      role="region"
      aria-label="Validation issues"
    >
      <div className="border-b border-border px-2.5 py-1.5 text-xs font-semibold text-text-secondary">
        Validation ({sorted.length})
      </div>
      <ul>
        {sorted.map((issue) => (
          <li key={issue.id}>
            <button
              type="button"
              className="flex w-full cursor-pointer items-start gap-1.5 px-2.5 py-1.5 text-left text-[13px] hover:bg-surface-elevated disabled:cursor-default disabled:hover:bg-transparent"
              onClick={() => onIssueClick(issue)}
              disabled={issue.nodeId === undefined}
            >
              <span className={SEVERITY_COLOR[issue.severity]}>
                {SEVERITY_ICON[issue.severity]}
              </span>
              <span>{issue.message}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
