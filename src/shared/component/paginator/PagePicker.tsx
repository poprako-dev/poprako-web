import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { PencilLine, Star } from "lucide-react";
import clsx from "clsx";
import type { PageStat } from "./page-stat";

type Props = {
  currentPageIndex: number;
  pages: readonly PageStat[];
  onSelect: (index: number) => void;
  children?: ReactNode;
};

export function PagePicker({ currentPageIndex, pages, onSelect, children }: Props): ReactElement {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const selected = listRef.current?.children[currentPageIndex];
      if (selected instanceof HTMLElement) {
        selected.scrollIntoView({ block: "nearest" });
      }
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [currentPageIndex]);

  return (
    <div
      ref={listRef}
      className={clsx(
        "absolute top-full right-0 mt-1 z-50",
        "bg-surface-white/95 backdrop-blur-md",
        "rounded-sm shadow-2xl border border-line-black/5",
        "max-h-60 overflow-y-auto",
        "max-w-[calc(100vw-1rem)]",
        pages.some((stat) => stat.flaggedUnits !== undefined) ? "w-56" : "w-44",
      )}
    >
      {pages.map((page, index) => (
        <button
          type="button"
          key={page.pageId}
          onClick={() => {
            onSelect(index);
          }}
          aria-current={index === currentPageIndex ? "page" : undefined}
          className={clsx(
            "w-full flex items-center justify-between px-3 py-1.5",
            "text-xs hover:bg-surface-stone-100 transition-colors active:bg-surface-stone-200",
            "border-none outline-none",
            index === currentPageIndex && "bg-surface-stone-100",
          )}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={clsx(
                "size-2 shrink-0 rounded-full",
                page.totalUnits > 0 && page.proofreadUnits >= page.totalUnits
                  ? "bg-surface-green-500"
                  : page.totalUnits > 0 && page.translatedUnits >= page.totalUnits
                    ? "bg-surface-orange-400"
                    : "bg-surface-gray-400",
              )}
            />
            <span className="text-ink-stone-700 font-medium">P{index + 1}</span>
            {page.flaggedUnits !== undefined && page.flaggedUnits > 0 && (
              <span
                title={`${String(page.flaggedUnits)} 个待回看的标记`}
                aria-label={`${String(page.flaggedUnits)} 个待回看的标记`}
                className="flex shrink-0 items-center text-[var(--status-flag)]"
              >
                <Star size={12} fill="currentColor" aria-hidden />
              </span>
            )}
            {page.hasLocalDraft && (
              <span
                role="img"
                aria-label="有未保存草稿"
                title="有未保存草稿"
                className="flex shrink-0 items-center text-ink-stone-400"
              >
                <PencilLine size={12} aria-hidden />
              </span>
            )}
          </span>
          <span className="flex items-center font-mono text-[11px]">
            <span className="text-ink-stone-400">{page.totalUnits}</span>
            <span className="text-ink-stone-300 mx-px">/</span>
            <span className="text-ink-orange-400">{page.translatedUnits}</span>
            <span className="text-ink-stone-300 mx-px">/</span>
            <span className="text-ink-pink-400">{page.proofreadUnits}</span>
          </span>
        </button>
      ))}
      {children}
    </div>
  );
}
