import { useState } from "react";
import type { ReadOnlyView } from "../revision-note/revision-note";

export const READ_ONLY_VIEW_STORAGE_KEY = "translator:read-only-view";

export function readReadOnlyView(): ReadOnlyView {
  try {
    return localStorage.getItem(READ_ONLY_VIEW_STORAGE_KEY) === "revision_note"
      ? "revision_note"
      : "unit";
  } catch {
    return "unit";
  }
}

export function useReadOnlyView(available: boolean): {
  view: ReadOnlyView;
  toggle: () => void;
} {
  const [preferred, setPreferred] = useState(readReadOnlyView);
  const view = available ? preferred : "unit";

  function toggle(): void {
    if (!available) return;
    const next = view === "unit" ? "revision_note" : "unit";
    setPreferred(next);
    try {
      localStorage.setItem(READ_ONLY_VIEW_STORAGE_KEY, next);
    } catch {
      // The selected view remains available for this session without storage.
    }
  }

  return { view, toggle };
}
