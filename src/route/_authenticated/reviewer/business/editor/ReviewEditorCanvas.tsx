import type { JSX } from "react";
import { Check, Loader2, SquareArrowRight } from "lucide-react";
import { PageCanvas } from "@/shared/component/PageCanvas";
import { Paginator } from "@/shared/component/Paginator";
import { ReviewPreviewStatus } from "../issue/ReviewPreviewStatus";
import { EditableIssueOverlay } from "./EditableIssueOverlay";
import { ReviewCreationToolbar } from "./ReviewCreationToolbar";
import type { ReviewEditor } from "./use-review-editor";

type Props = { editor: ReviewEditor };
const buttonClass =
  "flex size-8 items-center justify-center rounded-md border border-line-gray-200 bg-surface-white/85 text-ink-gray-700 shadow-sm transition-colors hover:bg-surface-white hover:text-ink-gray-900 disabled:opacity-40";

export function ReviewEditorCanvas({ editor }: Props): JSX.Element {
  const {
    review,
    props,
    canvasRef,
    interaction,
    page,
    selectedId,
    visible,
    drawing,
    disabled,
    gesture,
    select,
    exit,
    completing,
    pageIndex,
    navigate,
    completed,
    setConfirmComplete,
  } = editor;
  return (
    <div className="@container relative h-full w-full bg-surface-stone-700">
      <PageCanvas
        ref={canvasRef}
        interaction={interaction}
        imageSrc={review.page?.composite.source ?? null}
        isLoading={review.loading}
        empty={null}
        onImageError={review.onImageError}
        overlay={(scale) => (
          <EditableIssueOverlay
            scale={scale}
            issues={page?.issues ?? []}
            selectedId={selectedId}
            visible={visible}
            drawing={Boolean(drawing)}
            disabled={disabled}
            gesture={gesture}
            onSelect={(id) => {
              select(id);
            }}
          />
        )}
      />
      <ReviewPreviewStatus review={review} />
      <button
        type="button"
        aria-label="退出监修工作台"
        title="退出"
        onClick={exit}
        disabled={completing}
        className={`absolute left-2 top-2 ${buttonClass}`}
      >
        <SquareArrowRight size={20} />
      </button>
      <div className="absolute right-2 top-2">
        <Paginator
          mode="list"
          currPageIndex={pageIndex}
          totalPageCount={props.project.pages.length}
          pageStats={props.project.pages.map((page) => ({ pageId: page.id }))}
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
      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        <ReviewCreationToolbar editor={editor} />
        <button
          type="button"
          aria-label={completed ? "已完成监修" : "完成监修"}
          title={completed ? "已完成监修" : "完成监修"}
          disabled={disabled || completed}
          onClick={() => {
            setConfirmComplete(true);
          }}
          className={buttonClass}
        >
          {completing ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
        </button>
      </div>
    </div>
  );
}
