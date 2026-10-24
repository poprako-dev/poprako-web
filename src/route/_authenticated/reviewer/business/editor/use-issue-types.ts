import { useEffect, useState } from "react";
import { ISSUE_TYPES } from "./issue-types";
import { message } from "./review-editing";
import type { ReviewEditor } from "./review-editor-types";

export type IssueTypes = {
  types: string[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  count: (type: string) => number;
  add: (type: string) => void;
  remove: (type: string) => void;
  rename: (type: string, name: string) => void;
};

export function useIssueTypes(editor: ReviewEditor): IssueTypes {
  const [added, setAdded] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const loading = useCategoryPages(editor);
  const known = useKnownTypes(editor.pages);
  const count = (type: string): number => categoryReferences(editor.pages, type);
  const types = [...new Set([...ISSUE_TYPES, ...added, ...known])].filter(
    (type) => !removed.includes(type) || count(type) > 0,
  );
  function add(type: string): void {
    if (ISSUE_TYPES.includes(type)) return;
    setAdded((current) => [...new Set([...current, type])]);
    setRemoved((current) => current.filter((item) => item !== type));
  }
  function remove(type: string): void {
    requireCategoryReady(editor, type);
    if (categoryReferences(editor.session.getSnapshot(), type))
      throw new Error("分类仍被标注引用，不能删除");
    setAdded((current) => current.filter((item) => item !== type));
    setRemoved((current) => [...new Set([...current, type])]);
  }
  function rename(type: string, name: string): void {
    requireCategoryReady(editor, type);
    if (type === name.trim()) return;
    if (!name.trim() || (name !== type && types.includes(name.trim())))
      throw new Error("分类名称不能为空或与已有分类重复");
    renameCategory(editor, type, name.trim());
    setAdded((current) => [...new Set([...current.filter((item) => item !== type), name.trim()])]);
    setRemoved((current) => [...current.filter((item) => item !== name.trim()), type]);
  }
  return { types, ...loading, count, add, remove, rename };
}

function useKnownTypes(pages: ReviewEditor["pages"]): string[] {
  const [known, setKnown] = useState<string[]>([]);
  const current = Object.values(pages).flatMap((page) => page.issues.map((issue) => issue.variant));
  if (current.some((type) => !known.includes(type))) {
    const next = [...new Set([...known, ...current])];
    setKnown(next);
    return next;
  }
  return known;
}

function categoryReferences(pages: ReviewEditor["pages"], type: string): number {
  return Object.values(pages).reduce(
    (sum, page) => sum + page.issues.filter((issue) => issue.variant === type).length,
    0,
  );
}

function requireCategoryReady(editor: ReviewEditor, type: string): void {
  if (editor.disabled || ISSUE_TYPES.includes(type)) throw new Error("此分类不能修改");
  if (!editor.props.project.pages.every((page) => editor.session.getSnapshot()[page.id]))
    throw new Error("分类引用尚未加载完成，请重试");
}

function renameCategory(editor: ReviewEditor, type: string, name: string): void {
  const affected = Object.entries(editor.session.getSnapshot()).filter(([, page]) =>
    page.issues.some((issue) => issue.variant === type),
  );
  if (affected.some(([, page]) => page.blocked)) throw new Error("请先核对更新，再重命名分类");
  for (const [pageId, page] of affected)
    editor.session.commit(
      pageId,
      page.issues.map((issue) => (issue.variant === type ? { ...issue, variant: name } : issue)),
    );
}

function useCategoryPages(editor: ReviewEditor): Pick<IssueTypes, "loading" | "error" | "retry"> {
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
