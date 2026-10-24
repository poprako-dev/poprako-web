import { useRef, useState } from "react";
import type { JSX } from "react";
import { SquareArrowRight } from "lucide-react";
import { WorkbenchLayout } from "@/shared/component/WorkbenchLayout";
import { PageCanvas } from "@/shared/component/PageCanvas";
import type { CanvasHandle } from "@/shared/component/PageCanvas";
import { Paginator } from "@/shared/component/Paginator";
import { usePageInteraction } from "@/shared/hook/use-page-interaction";
import { useRelocationPreference } from "@/shared/hook/use-relocation-preference";
import { useShortcuts } from "@/shared/hook/use-shortcuts";
import { useReviewWorkspace } from "./issue/use-review-workspace";
import { ReadOnlyReviewSidebar } from "./ReadOnlyReviewSidebar";
import { IssueOverlay } from "./issue/IssueOverlay";
import { ReviewPreviewStatus } from "./issue/ReviewPreviewStatus";
import type { ReviewerProps } from "./reviewer-props";
type Props = ReviewerProps;

function InvalidReviewPage({ onExit }: { onExit: () => void }): JSX.Element {
  return (
    <div role="alert" className="flex h-full items-center justify-center">
      页面不属于当前章节
      <button type="button" title="返回" onClick={onExit} className="ml-2 underline">
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

export function ReadOnlyReviewer({
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
        <ReadOnlyReviewSidebar
          onImport={onImport}
          relocation={relocation}
          visible={visible}
          setVisible={setVisible}
          review={review}
        />
      }
    />
  );
}
