import { useEffect, useState } from "react";
import { message } from "./review-editing";
import type { ReviewEditor } from "./review-editor-types";
import type { IssueTypes } from "./use-issue-types";

export function useCategoryPages(
  editor: ReviewEditor,
): Pick<IssueTypes, "loading" | "error" | "retry"> {
  const { session, props } = editor;
  const ready = Boolean(editor.page);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const missing = props.project.pages.some((page) => !editor.pages[page.id]);
  useEffect(() => {
    if (!ready) return;
    const abort = new AbortController();
    async function load(): Promise<void> {
      try {
        for (const page of props.project.pages) {
          if (!session.getSnapshot()[page.id]) await session.load(page.id, abort.signal);
        }
      } catch (cause) {
        if (!abort.signal.aborted) setError(message(cause));
      }
    }
    void load();
    return () => {
      abort.abort();
    };
  }, [session, props.project.pages, ready, attempt]);
  return {
    loading: missing,
    error,
    retry: () => {
      setError(null);
      setAttempt((value) => value + 1);
    },
  };
}
