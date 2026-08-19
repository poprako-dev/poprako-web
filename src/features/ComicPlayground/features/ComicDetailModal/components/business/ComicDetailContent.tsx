import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { History, Images } from "lucide-react";

export type ComicDetailView = "pages" | "workflow";

type Props = {
  activeView: ComicDetailView;
  chapterId: string | null;
  pageList: ReactNode;
  workflowPanel: ReactNode;
  onChangeView: (view: ComicDetailView) => void;
};

type ViewButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
};

function ViewButton({
  active,
  label,
  onClick,
  children,
}: ViewButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "flex h-6 w-12 items-center justify-center rounded-sm",
        "transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-primary/60",
        active
          ? "bg-stone-200 text-stone-700 shadow-(--shadow-sm)"
          : "text-stone-400 hover:bg-stone-100 hover:text-stone-600",
      )}
    >
      {children}
    </button>
  );
}

export default function ComicDetailContent({
  activeView,
  chapterId,
  pageList,
  workflowPanel,
  onChangeView,
}: Props) {
  const [displayedView, setDisplayedView] =
    useState<ComicDetailView>(activeView);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (activeView === displayedView) {
      const frameId = window.requestAnimationFrame(() => setIsFading(false));
      return () => window.cancelAnimationFrame(frameId);
    }

    const frameId = window.requestAnimationFrame(() => setIsFading(true));
    const timeoutId = window.setTimeout(() => {
      setDisplayedView(activeView);
      setIsFading(false);
    }, 120);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [activeView, displayedView]);

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-stone-50">
      <div className="flex shrink-0 items-center gap-3 px-4 py-0.5">
        <div
          aria-hidden="true"
          className={clsx(
            "h-px min-w-0 flex-1",
            "bg-linear-to-r from-stone-300 via-stone-200 to-transparent",
          )}
        />
        <div
          role="group"
          aria-label="章节内容视图"
          className="flex rounded-md bg-stone-100/90 p-0.5"
        >
          <ViewButton
            active={activeView === "pages"}
            label="页面列表"
            onClick={() => onChangeView("pages")}
          >
            <Images size={14} aria-hidden="true" />
          </ViewButton>
          <ViewButton
            active={activeView === "workflow"}
            label="工作流记录"
            onClick={() => onChangeView("workflow")}
          >
            <History size={14} aria-hidden="true" />
          </ViewButton>
        </div>
      </div>

      <div
        className={clsx(
          "min-h-0 flex-1 bg-stone-100",
          "shadow-[inset_0_2px_6px_rgba(0,0,0,0.05)]",
        )}
      >
        <div
          className={clsx(
            "h-full transition-opacity duration-150 ease-out",
            "motion-reduce:transition-none",
            isFading ? "opacity-0" : "opacity-100",
          )}
        >
          <div
            key={`${displayedView}-${chapterId ?? "none"}`}
            className="h-full"
          >
            {displayedView === "pages" ? (
              <div
                className={clsx(
                  "h-full overflow-y-auto p-4",
                  "scrollbar-thin scrollbar-thumb-stone-300",
                )}
              >
                {pageList}
              </div>
            ) : (
              workflowPanel
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
