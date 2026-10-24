import type { JSX } from "react";
import { Eye, MapPin, RotateCcw, FileUp } from "lucide-react";
import clsx from "clsx";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { IssueList } from "./issue/IssueList";
import type { ReviewWorkspace } from "./issue/use-review-workspace";
import type { useRelocationPreference } from "@/shared/hook/use-relocation-preference";
type Props = {
  onImport?: (() => void) | undefined;
  relocation: ReturnType<typeof useRelocationPreference>;
  visible: boolean;
  setVisible: (update: (value: boolean) => boolean) => void;
  review: ReviewWorkspace;
};
const buttonClass =
  "flex-1 flex items-center justify-center py-2 transition-colors text-ink-stone-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]";
export function ReadOnlyReviewSidebar({
  onImport,
  relocation,
  visible,
  setVisible,
  review,
}: Props): JSX.Element {
  return (
    <>
      <div className="relative z-30 shrink-0 border-b-2 border-line-stone-200 bg-surface-stone-50">
        <div className="flex w-full divide-x divide-separator-stone-200">
          {onImport && (
            <button
              type="button"
              title="导入整章标注"
              aria-label="导入整章标注"
              onClick={onImport}
              className={clsx(buttonClass, "bg-surface-white hover:bg-surface-stone-100")}
            >
              <FileUp size={18} />
            </button>
          )}
          <button
            type="button"
            title="切换重定位模式"
            aria-label="切换重定位模式"
            aria-pressed={relocation.isRelocationEnabled}
            onClick={relocation.toggleRelocation}
            className={clsx(
              buttonClass,
              relocation.isRelocationEnabled
                ? "bg-surface-green-50 hover:bg-surface-green-100"
                : "bg-surface-white hover:bg-surface-stone-100",
            )}
          >
            <MapPin size={18} />
          </button>
          <button
            type="button"
            title={visible ? "隐藏标注矩形" : "显示标注矩形"}
            aria-label="切换标注矩形显示"
            aria-pressed={visible}
            onClick={() => {
              setVisible((value) => !value);
            }}
            className={clsx(
              buttonClass,
              visible
                ? "bg-surface-green-50 hover:bg-surface-green-100"
                : "bg-surface-white hover:bg-surface-stone-100",
            )}
          >
            <Eye size={18} />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
        {review.issuesLoading && (
          <div
            role="status"
            className="flex items-center justify-center gap-2 p-3 text-xs text-ink-stone-600"
          >
            <LoadingCircle size={16} aria-label="正在加载标注" />
            <span>正在读取本页监稿标注…</span>
          </div>
        )}
        {review.issuesError && (
          <button
            type="button"
            title={review.issuesError}
            aria-label="重试标注"
            onClick={review.retryIssues}
            className="self-center p-2 text-ink-stone-600"
          >
            <span role="alert">标注加载失败：{review.issuesError}</span>
            <RotateCcw size={18} />
          </button>
        )}
        {!review.issuesLoading && !review.issuesError && (
          <IssueList
            issues={review.issues}
            focusedId={review.focusedId}
            onSelect={(id) => {
              review.select(id, true);
            }}
          />
        )}
      </div>
    </>
  );
}
