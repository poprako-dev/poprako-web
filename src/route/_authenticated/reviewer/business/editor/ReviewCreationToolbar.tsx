import type { JSX } from "react";
import { MessageSquarePlus, ScanLine } from "lucide-react";
import clsx from "clsx";
import type { ReviewEditor } from "./use-review-editor";

type Props = { editor: ReviewEditor };
const toolClass =
  "flex h-8 w-10 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function ReviewCreationToolbar({ editor }: Props): JSX.Element {
  const drawLabel = editor.drawing ? "取消框选 · Esc" : "框选标注 · R";
  return (
    <div
      role="group"
      aria-label="创建标注"
      className="flex shrink-0 divide-x divide-line-gray-200 overflow-hidden rounded-md border border-line-gray-200 bg-surface-white/85 text-ink-gray-700 shadow-sm"
    >
      <button
        type="button"
        title={drawLabel}
        aria-label={drawLabel}
        aria-pressed={Boolean(editor.drawing)}
        disabled={editor.disabled || !editor.review.page || Boolean(editor.review.error)}
        onClick={() => {
          editor.setVisible(true);
          if (editor.drawing) editor.gesture.cancel();
          else editor.setDrawing({ id: null });
        }}
        className={clsx(
          toolClass,
          editor.drawing
            ? "bg-surface-green-50 text-ink-green-800 hover:bg-surface-green-100"
            : "hover:bg-surface-white hover:text-ink-gray-900",
        )}
      >
        <ScanLine size={18} />
      </button>
      <button
        type="button"
        title="新增整页说明"
        aria-label="新增整页说明"
        disabled={editor.disabled}
        onClick={() => {
          editor.gesture.cancel();
          editor.add(null);
        }}
        className={`${toolClass} hover:bg-surface-white hover:text-ink-gray-900`}
      >
        <MessageSquarePlus size={18} />
      </button>
    </div>
  );
}
