import { useEffect } from "react";
import { useShortcuts } from "@/shared/hook/use-shortcuts";
import { useShortcutActions } from "@/shared/hook/use-shortcut-actions";
import { shouldIgnoreWorkbenchKey } from "@/shared/utility/keyboard-scope";
import { pageIsDirty } from "./review-editing";
import type { ReviewEditor } from "./use-review-editor";

export function useReviewEditorLifecycle(editor: ReviewEditor): void {
  const { configurableShortcuts } = useShortcuts();
  const modal = Boolean(editor.deleteId) || editor.confirmComplete;
  const shortcuts = configurableShortcuts.filter((shortcut) =>
    ["save", "undo"].includes(shortcut.action),
  );
  useShortcutActions(
    {
      save: editor.save,
      undo: () => {
        editor.session.undo(editor.pageId);
      },
    },
    shortcuts,
    editor.disabled || modal,
    "[data-review-editor]",
  );
  useNavigationShortcuts(editor, modal);
  useDrawShortcut(editor, modal);
  useAutoSave(editor);
}

function selectNext(editor: ReviewEditor, direction: number): void {
  const issues = editor.page?.issues ?? [];
  if (!issues.length) return;
  const current = issues.findIndex((issue) => issue.id === editor.selectedId);
  const index =
    current < 0
      ? direction > 0
        ? 0
        : issues.length - 1
      : (current + direction + issues.length) % issues.length;
  const issue = issues[index];
  if (issue) {
    editor.select(issue.id, true);
    editor.setFocusInput(issue.id);
  }
}

function useDrawShortcut(editor: ReviewEditor, modal: boolean): void {
  useEffect(() => {
    function keydown(event: KeyboardEvent): void {
      if (editor.disabled || modal || shouldIgnoreWorkbenchKey(event)) return;
      if (
        event.key.toLowerCase() !== "r" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.repeat
      )
        return;
      if (!editor.review.page || editor.review.error) return;
      event.preventDefault();
      editor.setVisible(true);
      editor.setDrawing({ id: null });
    }
    globalThis.addEventListener("keydown", keydown);
    return () => {
      globalThis.removeEventListener("keydown", keydown);
    };
  }, [editor, modal]);
}

function useAutoSave(editor: ReviewEditor): void {
  const { session, pageId, completing, drawing } = editor;
  useEffect(() => {
    const timer = setInterval(() => {
      const page = session.getSnapshot()[pageId];
      if (page && !page.blocked && !completing && !drawing)
        void session.save(pageId).catch(() => undefined);
    }, 60_000);
    function beforeUnload(event: BeforeUnloadEvent): void {
      if (!Object.values(session.getSnapshot()).some((page) => pageIsDirty(page) || page.saving))
        return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [session, pageId, completing, drawing]);
  useEffect(() => {
    const abort = new AbortController();
    function refresh(): void {
      if (document.visibilityState !== "visible" || !session.getSnapshot()[pageId] || completing)
        return;
      void session.load(pageId, abort.signal).catch(() => undefined);
    }
    document.addEventListener("visibilitychange", refresh);
    return () => {
      abort.abort();
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [session, pageId, completing]);
}

function useNavigationShortcuts(editor: ReviewEditor, modal: boolean): void {
  const { configurableShortcuts } = useShortcuts();
  useShortcutActions(
    {
      nextMarker: () => {
        selectNext(editor, 1);
      },
      prevMarker: () => {
        selectNext(editor, -1);
      },
      pageUp: () => {
        void editor.navigate(editor.pageIndex - 1);
      },
      pageDown: () => {
        void editor.navigate(editor.pageIndex + 1);
      },
      toggleRelocation: editor.relocation.toggleRelocation,
      toggleProofreadPreview: () => {
        editor.setVisible((visible) => !visible);
      },
    },
    configurableShortcuts.filter((shortcut) =>
      [
        "nextMarker",
        "prevMarker",
        "pageUp",
        "pageDown",
        "toggleRelocation",
        "toggleProofreadPreview",
      ].includes(shortcut.action),
    ),
    editor.disabled || modal,
    "[data-issue-id]",
  );
}
