import type { JSX } from "react";
import { RotateCcw } from "lucide-react";
import type { ReviewWorkspace } from "./use-review-workspace";

type Props = {
  review: ReviewWorkspace;
};

export function ReviewPreviewStatus({ review }: Props): JSX.Element | null {
  if (!review.error && !review.cancelled) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-5">
      <section
        aria-label="嵌稿预览状态"
        className="pointer-events-auto w-full max-w-sm rounded-md border border-line-stone-300 bg-surface-stone-50 p-5 text-ink-stone-800 shadow-lg"
      >
        <p role="alert" className="whitespace-pre-wrap break-words text-sm text-text-danger">
          {review.error ?? "已取消预览加载"}
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            aria-label="重试成稿预览"
            onClick={review.retry}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line-stone-300 bg-surface-white px-3 py-2 text-sm text-ink-stone-700 hover:bg-surface-stone-100 focus-visible:outline-2 focus-visible:outline-outline-stone-500"
          >
            <RotateCcw size={14} />
            重新加载预览
          </button>
        </div>
      </section>
    </div>
  );
}
