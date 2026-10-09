import type { JSX } from "react";
import { RotateCcw } from "lucide-react";
import type { ReviewWorkspace } from "./use-review-workspace";
type Props = { review: ReviewWorkspace };
export function ReviewPreviewStatus({ review }: Props): JSX.Element | null {
  if (!review.error) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-stone-600 text-ink-white">
      <button
        type="button"
        title={review.error}
        aria-label="重试成稿预览"
        onClick={review.retry}
        className="flex max-w-sm flex-col items-center gap-3 p-4"
      >
        <span role="alert">PSD 预览加载失败：{review.error}</span>
        <RotateCcw size={18} />
      </button>
    </div>
  );
}
