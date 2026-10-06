import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { PageInput } from "./paginator/PageInput";
import { PagePicker } from "./paginator/PagePicker";
import type { PageStat } from "./paginator/page-stat";

export type { PageStat } from "./paginator/page-stat";

type CommonProps = {
  currPageIndex: number;
  totalPageCount: number;
  onPageUp: () => void;
  onPageDown: () => void;
};

type Props = CommonProps &
  (
    | { mode: "display" }
    | { mode: "input"; onPageIndexChange: (index: number) => void }
    | {
        mode: "list";
        onPageIndexChange: (index: number) => void;
        pageStats: readonly PageStat[];
        onPageListOpenChange?: (isOpen: boolean) => void;
        pageListFooter?: ReactNode;
      }
  );

export function Paginator(props: Props): ReactElement {
  const { currPageIndex, totalPageCount, onPageUp, onPageDown } = props;
  const displayPage = Math.max(0, Math.min(totalPageCount, currPageIndex + 1));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const onOpenChange = props.mode === "list" ? props.onPageListOpenChange : undefined;
  const canOpenList = props.mode === "list" && totalPageCount > 0 && props.pageStats.length > 0;
  const isListVisible = isDropdownOpen && canOpenList;

  function changeOpen(isOpen: boolean): void {
    setIsDropdownOpen(isOpen);
    onOpenChange?.(isOpen);
  }

  useEffect(() => {
    if (!isListVisible) {
      return;
    }
    function handlePointerDown(event: PointerEvent): void {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
        onOpenChange?.(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isListVisible, onOpenChange]);

  return (
    <>
      <div className="relative z-50 inline-block select-none" ref={containerRef}>
        <div
          className={clsx(
            "inline-flex items-stretch",
            "h-8 w-24",
            "bg-surface-white/95 backdrop-blur-md",
            "rounded-sm shadow-2xl",
            "overflow-hidden",
          )}
          style={{ opacity: 0.85 }}
        >
          <button
            type="button"
            onClick={onPageUp}
            disabled={totalPageCount === 0 || currPageIndex <= 0}
            aria-label="Previous page"
            className={clsx(
              "flex items-center justify-center",
              "flex-1",
              "hover:bg-surface-stone-400/40",
              "disabled:opacity-20 disabled:hover:bg-transparent",
              "transition-colors border-none outline-none",
              "active:bg-surface-stone-400/60",
              "hover:[&>svg]:text-ink-stone-950",
              "hover:shadow-inner",
            )}
          >
            <ChevronLeft size={14} className="text-ink-gray-600" />
          </button>
          <div
            className={clsx(
              "flex flex-none items-center justify-center w-16",
              "border-x border-line-gray-100 bg-surface-gray-50/20",
            )}
          >
            {props.mode === "list" ? (
              <button
                type="button"
                onClick={() => {
                  changeOpen(!isListVisible);
                }}
                disabled={!canOpenList}
                aria-label="Open page list"
                aria-expanded={isListVisible}
                className={clsx(
                  "flex items-center justify-center gap-0.5",
                  "w-full h-full",
                  "hover:bg-surface-stone-400/30 transition-colors",
                  "border-none outline-none",
                  "active:bg-surface-stone-400/50",
                  "hover:shadow-inner",
                )}
              >
                <span className="text-xs text-ink-gray-900 font-bold">{displayPage}</span>
                <span className="text-xs text-ink-gray-300 font-light">/</span>
                <span className="text-xs text-ink-gray-600 font-semibold">{totalPageCount}</span>
              </button>
            ) : props.mode === "input" ? (
              <PageInput
                key={`${String(displayPage)}:${String(totalPageCount)}`}
                displayPage={displayPage}
                totalPageCount={totalPageCount}
                onChange={props.onPageIndexChange}
              />
            ) : (
              <>
                <span className="text-sm text-ink-gray-900 font-bold w-6 text-center">
                  {displayPage}
                </span>
                <span className="text-xs text-ink-gray-300 font-light select-none">/</span>
                <span className="text-sm text-ink-gray-600 font-semibold w-6 text-center">
                  {totalPageCount}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onPageDown}
            disabled={totalPageCount === 0 || currPageIndex >= totalPageCount - 1}
            aria-label="Next page"
            className={clsx(
              "flex items-center justify-center",
              "flex-1",
              "hover:bg-surface-stone-400/40",
              "disabled:opacity-20 disabled:hover:bg-transparent",
              "transition-colors border-none outline-none",
              "active:bg-surface-stone-400/60",
              "hover:[&>svg]:text-ink-stone-950",
              "hover:shadow-inner",
            )}
          >
            <ChevronRight size={14} className="text-ink-gray-600" />
          </button>
        </div>
        {props.mode === "list" && isListVisible && (
          <PagePicker
            currentPageIndex={currPageIndex}
            pages={props.pageStats}
            onSelect={(index) => {
              props.onPageIndexChange(index);
              changeOpen(false);
            }}
          >
            {props.pageListFooter}
          </PagePicker>
        )}
      </div>
      {isListVisible && (
        <button
          type="button"
          aria-label="Close page list"
          className="fixed inset-0 z-40 bg-surface-black/25"
          onClick={() => {
            changeOpen(false);
          }}
        />
      )}
    </>
  );
}
