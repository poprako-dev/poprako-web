import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
import { Star } from "lucide-react";
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
        "absolute right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto",
        "max-w-[calc(100vw-1rem)] rounded-sm border border-border bg-background/95 shadow-lg",
        pages.some((page) => page.flaggedUnits !== undefined) ? "w-56" : "w-44",
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
            "flex w-full items-center justify-between px-3 py-1.5 text-xs text-foreground",
            "transition-colors hover:bg-accent active:bg-accent",
            "focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
            "focus-visible:outline-primary",
            index === currentPageIndex && "bg-accent",
          )}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={clsx(
                "size-1.5 shrink-0 rounded-full",
                page.totalUnits > 0 && page.proofreadUnits >= page.totalUnits
                  ? "bg-primary"
                  : page.totalUnits > 0 && page.translatedUnits >= page.totalUnits
                    ? "bg-chart-2"
                    : "bg-muted-foreground",
              )}
              aria-hidden
            />
            <span className="font-medium">P{index + 1}</span>
            {page.flaggedUnits !== undefined && page.flaggedUnits > 0 && (
              <span
                title={`${String(page.flaggedUnits)} 个待回看的标记`}
                aria-label={`${String(page.flaggedUnits)} 个待回看的标记`}
                className="flex items-center gap-0.5 text-chart-2"
              >
                <Star size={12} fill="currentColor" aria-hidden />
                {page.flaggedUnits}
              </span>
            )}
          </span>
          <span className="flex items-center font-mono text-[11px] text-muted-foreground">
            <span>{page.totalUnits}</span>
            <span className="mx-px">/</span>
            <span className="text-chart-2">{page.translatedUnits}</span>
            <span className="mx-px">/</span>
            <span className="text-primary">{page.proofreadUnits}</span>
          </span>
        </button>
      ))}
      {children}
    </div>
  );
}
