import { useRef, useState } from "react";
import type { JSX } from "react";
import { Eye, MapPin, RotateCcw, SquareArrowRight } from "lucide-react";
import clsx from "clsx";
import { WorkbenchLayout } from "@/shared/component/WorkbenchLayout";
import { PageCanvas } from "@/shared/component/PageCanvas";
import type { CanvasHandle } from "@/shared/component/PageCanvas";
import { Paginator } from "@/shared/component/Paginator";
import { usePageInteraction } from "@/shared/hook/use-page-interaction";
import { useRelocationPreference } from "@/shared/hook/use-relocation-preference";
import { useShortcuts } from "@/shared/hook/use-shortcuts";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { useRevisionWorkspace } from "./revision-note/use-revision-workspace";
import { RevisionLayerMenu } from "./revision-note/RevisionLayerMenu";
import { RevisionNoteList } from "./revision-note/RevisionNoteList";
import { RevisionNoteOverlay } from "./revision-note/RevisionNoteOverlay";
import { RevisionPreviewStatus } from "./revision-note/RevisionPreviewStatus";
import type { ReviewerProps } from "./reviewer-props";
type Props = ReviewerProps;
const buttonClass =
  "flex-1 flex items-center justify-center py-2 transition-colors text-ink-stone-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]";
export function Reviewer({
  project,
  startPageId,
  loadRevisionPage,
  loadRevisionNotes,
  onExit,
}: Props): JSX.Element {
  const [pageIndex, setPageIndex] = useState(() =>
    project.pages.findIndex((page) => page.id === startPageId),
  );
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<CanvasHandle>(null);
  const relocation = useRelocationPreference();
  const { configurableShortcuts } = useShortcuts();
  function navigate(index: number): Promise<void> {
    if (index >= 0 && index < project.pages.length) setPageIndex(index);
    return Promise.resolve();
  }
  const revision = useRevisionWorkspace({
    pageId: project.pages[pageIndex]?.id ?? "",
    pageIndex,
    pageCount: project.pages.length,
    active: pageIndex >= 0,
    loadRevisionPage,
    loadRevisionNotes,
    shortcuts: configurableShortcuts.filter((shortcut) =>
      [
        "nextMarker",
        "prevMarker",
        "pageUp",
        "pageDown",
        "toggleRelocation",
        "toggleProofreadPreview",
      ].includes(shortcut.action),
    ),
    relocation: relocation.isRelocationEnabled,
    onToggleRelocation: relocation.toggleRelocation,
    onToggleVisible: () => {
      setVisible((value) => !value);
    },
    onNavigate: navigate,
    canvasRef,
  });
  const imageSrc = revision.page?.composite.source ?? null;
  const interaction = usePageInteraction({ imageSrc });
  if (pageIndex < 0)
    return (
      <div role="alert" className="flex h-full items-center justify-center">
        页面不属于当前章节
        <button type="button" onClick={onExit} className="ml-2 underline">
          返回
        </button>
      </div>
    );
  return (
    <WorkbenchLayout
      canvas={
        <div className="@container relative w-full h-full bg-surface-stone-700">
          <PageCanvas
            ref={canvasRef}
            interaction={interaction}
            imageSrc={imageSrc}
            isLoading={loadRevisionPage !== null && revision.loading}
            empty={null}
            onImageError={revision.onImageError}
            overlay={(scale) => (
              <RevisionNoteOverlay
                scale={scale}
                notes={revision.notes}
                focusedId={revision.focusedId}
                visible={visible}
                onSelect={(id) => {
                  revision.select(id, false);
                }}
              />
            )}
          />
          {loadRevisionPage ? (
            <RevisionPreviewStatus revision={revision} />
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
              <RevisionLayerMenu revision={revision} />
              <button
                type="button"
                title={visible ? "隐藏 revision_note 矩形" : "显示 revision_note 矩形"}
                aria-label="切换 revision_note 矩形显示"
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
            {revision.notesLoading && (
              <div role="status" className="flex justify-center p-2">
                <LoadingCircle size={16} aria-label="正在加载 revision_note" />
              </div>
            )}
            {revision.notesError && (
              <button
                type="button"
                title={revision.notesError}
                aria-label="重试 revision_note"
                onClick={revision.retryNotes}
                className="self-center p-2 text-ink-stone-600"
              >
                <span role="alert" className="sr-only">
                  revision_note 加载失败
                </span>
                <RotateCcw size={18} />
              </button>
            )}
            <RevisionNoteList
              notes={revision.notes}
              layers={revision.page?.layers ?? []}
              focusedId={revision.focusedId}
              onSelect={(id) => {
                revision.select(id, true);
              }}
            />
          </div>
        </>
      }
    />
  );
}
