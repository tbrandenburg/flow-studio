const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Returns true if the given event target is (or is inside) an element that
 * accepts text input, so bare single-letter keyboard shortcuts should be
 * suppressed while the user is typing into it.
 */
export function isInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (EDITABLE_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable || target.getAttribute("contenteditable") === "true") return true;

  const role = target.getAttribute("role");
  if (role === "textbox" || role === "combobox" || role === "searchbox") return true;

  return false;
}
