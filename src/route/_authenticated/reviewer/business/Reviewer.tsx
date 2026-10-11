import { useRef, useState } from "react";
import type { JSX } from "react";
import { Eye, MapPin, RotateCcw, SquareArrowRight, FileUp } from "lucide-react";
import clsx from "clsx";
import { WorkbenchLayout } from "@/shared/component/WorkbenchLayout";
import { PageCanvas } from "@/shared/component/PageCanvas";
import type { CanvasHandle } from "@/shared/component/PageCanvas";
import { Paginator } from "@/shared/component/Paginator";
import { usePageInteraction } from "@/shared/hook/use-page-interaction";
import { useRelocationPreference } from "@/shared/hook/use-relocation-preference";
import { useShortcuts } from "@/shared/hook/use-shortcuts";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { useReviewWorkspace } from "./issue/use-review-workspace";
import { IssueList } from "./issue/IssueList";
import { IssueOverlay } from "./issue/IssueOverlay";
import { ReviewPreviewStatus } from "./issue/ReviewPreviewStatus";
import type { ReviewerProps } from "./reviewer-props";
type Props = ReviewerProps;
const buttonClass =
  "flex-1 flex items-center justify-center py-2 transition-colors text-ink-stone-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]";

function InvalidReviewPage({ onExit }: { onExit: () => void }): JSX.Element {
  return (
    <div role="alert" className="flex h-full items-center justify-center">
      页面不属于当前章节
      <button type="button" onClick={onExit} className="ml-2 underline">
        返回
      </button>
    </div>
  );
}

function reviewerShortcuts(
  shortcuts: ReturnType<typeof useShortcuts>["configurableShortcuts"],
): ReturnType<typeof useShortcuts>["configurableShortcuts"] {
  return shortcuts.filter((shortcut) =>
    [
      "nextMarker",
      "prevMarker",
      "pageUp",
      "pageDown",
      "toggleRelocation",
      "toggleProofreadPreview",
    ].includes(shortcut.action),
  );
}

export function Reviewer({
  project,
  startPageId,
  loadReviewPage,
  loadIssues,
  onImport,
  onPageChange,
  onExit,
}: Props): JSX.Element {
  const [selectedPageIndex, setSelectedPageIndex] = useState(() =>
    project.pages.findIndex((page) => page.id === startPageId),
  );
  const pageIndex = Math.min(selectedPageIndex, project.pages.length - 1);
  const currentPage = project.pages[pageIndex];
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<CanvasHandle>(null);
  const relocation = useRelocationPreference();
  const { configurableShortcuts } = useShortcuts();
  function navigate(index: number): Promise<void> {
    const page = project.pages[index];
    if (page) {
      setSelectedPageIndex(index);
      onPageChange?.(page.id);
    }
    return Promise.resolve();
  }
  const review = useReviewWorkspace({
    pageId: currentPage?.id ?? "",
    pageIndex,
    pageCount: project.pages.length,
    active: pageIndex >= 0,
    loadReviewPage,
    loadIssues,
    shortcuts: reviewerShortcuts(configurableShortcuts),
    relocation: relocation.isRelocationEnabled,
    onToggleRelocation: relocation.toggleRelocation,
    onToggleVisible: () => {
      setVisible((value) => !value);
    },
    onNavigate: navigate,
    canvasRef,
  });
  const imageSrc = review.page?.composite.source ?? null;
  const interaction = usePageInteraction({ imageSrc });
  if (pageIndex < 0) return <InvalidReviewPage onExit={onExit} />;
  return (
    <WorkbenchLayout
      canvas={
        <div className="@container relative w-full h-full bg-surface-stone-700">
          <PageCanvas
            ref={canvasRef}
            interaction={interaction}
            imageSrc={imageSrc}
            isLoading={Boolean(loadReviewPage) && review.loading}
            empty={null}
            onImageError={review.onImageError}
            overlay={(scale) => (
              <IssueOverlay
                scale={scale}
                issues={review.issues}
                focusedId={review.focusedId}
                visible={visible}
                onSelect={(id) => {
                  review.select(id, false);
                }}
              />
            )}
          />
          {loadReviewPage ? (
            <ReviewPreviewStatus review={review} />
          ) : (
            <div
              role="status"
              className="absolute inset-0 flex items-center justify-center text-ink-white pointer-events-none"
            >
              预览暂不可用
            </div>
          )}
          <div className="absolute top-2 left-2">
            <button
              type="button"
              title="退出"
              aria-label="退出监修工作台"
              onClick={onExit}
              className="flex size-8 items-center justify-center rounded-md border border-line-gray-200 bg-surface-white/85 text-ink-gray-700 shadow-sm transition-colors hover:bg-surface-white hover:text-ink-gray-900"
            >
              <SquareArrowRight size={20} />
            </button>
          </div>
          <div className="absolute top-2 right-2">
            <Paginator
              mode="list"
              currPageIndex={pageIndex}
              totalPageCount={project.pages.length}
              pageStats={project.pages.map((page) => ({ pageId: page.id }))}
              onPageIndexChange={(index) => {
                void navigate(index);
              }}
              onPageUp={() => {
                void navigate(pageIndex - 1);
              }}
              onPageDown={() => {
                void navigate(pageIndex + 1);
              }}
            />
          </div>
        </div>
      }
      sidebar={
        <>
          <div className="relative z-30 shrink-0 border-b-2 border-line-stone-200 bg-surface-stone-50">
            <div className="flex w-full divide-x divide-separator-stone-200">
              {onImport && (
                <button
                  type="button"
                  title="导入整章 issue"
                  aria-label="导入整章 issue"
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
                title={visible ? "隐藏 issue 矩形" : "显示 issue 矩形"}
                aria-label="切换 issue 矩形显示"
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
                <LoadingCircle size={16} aria-label="正在加载 issue" />
                <span>正在读取本页监稿标注…</span>
              </div>
            )}
            {review.issuesError && (
              <button
                type="button"
                title={review.issuesError}
                aria-label="重试 issue"
                onClick={review.retryIssues}
                className="self-center p-2 text-ink-stone-600"
              >
                <span role="alert">issue 加载失败：{review.issuesError}</span>
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
      }
    />
  );
}
