import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { RotateCcw } from "lucide-react";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { IssueEditorItem } from "./IssueEditorItem";
import { useIssueTypes } from "./use-issue-types";
import { ReviewEditorToolbar } from "./ReviewEditorToolbar";
import { ReviewUpdateNotice } from "./ReviewUpdateNotice";
import type { ReviewEditor } from "./use-review-editor";

type Props = { editor: ReviewEditor };

export function ReviewEditorSidebar({ editor }: Props): JSX.Element {
  return (
    <>
      <ReviewEditorToolbar
        relocation={editor.relocation.isRelocationEnabled}
        visible={editor.visible}
        disabled={editor.disabled}
        canUndo={Boolean(editor.page?.history.length)}
        saving={editor.page?.saving ?? false}
        status={editor.status}
        onRelocate={editor.relocation.toggleRelocation}
        onVisible={() => {
          editor.setVisible((visible) => !visible);
        }}
        onSave={editor.save}
        onUndo={() => {
          editor.session.undo(editor.pageId);
        }}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
        <EditorFeedback editor={editor} />
        <ReviewUpdateNotice editor={editor} />
        <EditorList editor={editor} />
      </div>
    </>
  );
}

function EditorFeedback({ editor }: Props): JSX.Element | null {
  const error =
    editor.error ?? editor.page?.storageError ?? editor.page?.error ?? editor.review.issuesError;
  if (error)
    return (
      <div role="alert" className="flex items-center gap-2 p-3 text-sm text-ink-stone-600">
        <span>{error}</span>
        <button
          type="button"
          aria-label="重试保存或加载"
          title="重试"
          disabled={editor.completing}
          onClick={editor.page ? editor.save : editor.review.retryIssues}
          className="shrink-0 rounded p-1 hover:bg-surface-stone-200"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    );
  if (!editor.page && editor.review.issuesLoading)
    return (
      <div role="status" className="flex justify-center p-3">
        <LoadingCircle size={16} aria-label="正在加载标注" />
      </div>
    );
  return null;
}

function EditorList({ editor }: Props): JSX.Element {
  const listRef = useRef<HTMLDivElement>(null);
  const categories = useIssueTypes(editor);
  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLElement>("[data-issue-id]");
    const selected = [...(items ?? [])].find(
      (item) => item.dataset["issueId"] === editor.selectedId,
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [editor.selectedId]);
  return (
    <div ref={listRef} data-review-editor className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {editor.page?.issues.map((issue) => (
        <IssueEditorItem
          key={issue.id}
          issue={issue}
          selected={editor.selectedId === issue.id}
          focusInput={editor.focusInput === issue.id}
          disabled={editor.disabled}
          canDraw={Boolean(editor.review.page) && !editor.review.error}
          drawing={editor.drawing?.id === issue.id}
          categories={categories}
          onSelect={() => {
            editor.select(issue.id, true);
          }}
          onChange={(patch) => {
            if (patch.variant) categories.add(patch.variant);
            editor.modify(issue.id, patch);
          }}
          onDelete={() => {
            editor.setDeleteId(issue.id);
          }}
          onRedraw={() => {
            editor.setFocusInput(null);
            editor.setVisible(true);
            if (editor.drawing?.id === issue.id) editor.gesture.cancel();
            else editor.setDrawing({ id: issue.id });
          }}
        />
      ))}
      {editor.page?.issues.length === 0 && (
        <div className="p-4 text-center text-sm text-ink-stone-600">本页暂无标注</div>
      )}
    </div>
  );
}
