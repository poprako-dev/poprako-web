import type { JSX } from "react";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import type { ReviewEditor } from "./use-review-editor";

type Props = { editor: ReviewEditor };

export function ReviewEditorDialogs({ editor }: Props): JSX.Element {
  function remove(): void {
    if (!editor.page || editor.disabled) return;
    editor.session.commit(
      editor.pageId,
      editor.page.issues.filter((issue) => issue.id !== editor.deleteId),
    );
    editor.setDeleteId(null);
    editor.select(null);
  }
  return (
    <>
      {editor.deleteId && (
        <ConfirmDialog
          title="删除这条标注？"
          confirmLabel="删除"
          onCancel={() => {
            editor.setDeleteId(null);
          }}
          onConfirm={remove}
        />
      )}
      {editor.confirmComplete && (
        <ConfirmDialog
          title="完成监修？"
          description="保存本章修改并完成监修。"
          confirmLabel="完成监修"
          confirmTone="success"
          loading={editor.completing}
          onCancel={() => {
            if (!editor.completing) editor.setConfirmComplete(false);
          }}
          onConfirm={() => {
            void editor.complete();
          }}
        >
          {editor.error && (
            <p role="alert" className="p-4 text-sm text-ink-stone-700">
              {editor.error}
            </p>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
