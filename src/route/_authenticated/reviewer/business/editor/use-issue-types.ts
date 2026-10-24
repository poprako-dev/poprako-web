import { useMemo, useSyncExternalStore } from "react";
import { ISSUE_TYPES } from "./issue-types";
import { message } from "./review-editing";
import type { ReviewEditor } from "./review-editor-types";
import { createCategoryPresets } from "./category-presets";
import { useCategoryPages } from "./use-category-pages";
import { removeCategory, renameCategory } from "./review-categories";

export type IssueTypes = {
  types: string[];
  presets: string[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  count: (type: string) => number;
  add: (type: string) => void;
  remove: (type: string) => Promise<void>;
  rename: (type: string, name: string) => Promise<void>;
};

export function useIssueTypes(editor: ReviewEditor): IssueTypes {
  const store = useMemo(
    () => editor.session.source.presets ?? createCategoryPresets(),
    [editor.session],
  );
  const raw = useSyncExternalStore(store.subscribe, () => readPresets(store));
  const { names: presets, error } = JSON.parse(raw) as { names: string[]; error: string | null };
  const loading = useCategoryPages(editor);
  const used = Object.values(editor.pages).flatMap((page) =>
    page.issues.map((issue) => issue.variant),
  );
  const types = [...new Set([...ISSUE_TYPES, ...presets, ...used])];
  return {
    types,
    presets,
    ...loading,
    error: error ?? loading.error,
    count: (type) =>
      Object.values(editor.pages).reduce(
        (sum, page) => sum + page.issues.filter((issue) => issue.variant === type).length,
        0,
      ),
    add: (type) => {
      if (!ISSUE_TYPES.includes(type)) store.write([...store.read(), type]);
    },
    remove: (type) => removeCategory(editor, store, type),
    rename: (type, name) => renameCategory(editor, store, type, name, types),
  };
}

function readPresets(store: ReturnType<typeof createCategoryPresets>): string {
  try {
    return JSON.stringify({ names: store.read(), error: null });
  } catch (cause) {
    return JSON.stringify({ names: [], error: message(cause) });
  }
}
