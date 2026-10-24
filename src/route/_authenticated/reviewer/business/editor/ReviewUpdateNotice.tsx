import { useState } from "react";
import type { JSX } from "react";
import { Download } from "lucide-react";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import type { ReviewEditor } from "./use-review-editor";

type Props = { editor: ReviewEditor };

export function ReviewUpdateNotice({ editor }: Props): JSX.Element | null {
  const [confirm, setConfirm] = useState(false);
  const blocked = editor.page?.blocked;
  if (!blocked) return null;
  const imported = blocked.reviewKey !== editor.page?.baseline.reviewKey;
  function accept(keep: boolean): void {
    editor.session.resolve(editor.pageId, keep);
    editor.setError(null);
    editor.review.retry();
    setConfirm(false);
  }
  return (
    <div className="border-b border-line-stone-200 p-3 text-sm text-ink-stone-700">
      <p role="alert">
        {imported ? "本章审查已被重新导入，旧修改已暂停。" : "页面图片已更新，请核对标注位置。"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          title="导出草稿"
          aria-label="导出草稿"
          onClick={() => {
            exportDraft(editor);
          }}
        >
          <Download size={16} />
        </button>
        <button
          type="button"
          title="读取最新审查"
          className="underline"
          onClick={() => {
            setConfirm(true);
          }}
        >
          读取最新审查
        </button>
        {!imported && (
          <button
            type="button"
            title="保留修改并核对"
            className="underline"
            onClick={() => {
              accept(true);
            }}
          >
            保留修改并核对
          </button>
        )}
      </div>
      {confirm && (
        <ConfirmDialog
          title="放弃本页旧修改？"
          description="可先导出草稿，读取后无法回退。"
          confirmLabel="读取最新审查"
          onCancel={() => {
            setConfirm(false);
          }}
          onConfirm={() => {
            accept(false);
          }}
        />
      )}
    </div>
  );
}

function exportDraft(editor: ReviewEditor): void {
  const blob = new Blob([JSON.stringify(editor.page?.issues ?? [], null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `review-${editor.pageId}.json`;
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
