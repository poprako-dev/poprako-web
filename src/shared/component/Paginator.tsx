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
            "inline-flex h-8 w-24 items-stretch overflow-hidden rounded-sm",
            "border border-border bg-background/95 shadow-lg",
          )}
        >
          <button
            type="button"
            onClick={onPageUp}
            disabled={totalPageCount === 0 || currPageIndex <= 0}
            aria-label="Previous page"
            className={clsx(
              "flex flex-1 items-center justify-center text-muted-foreground",
              "transition-colors hover:bg-accent disabled:opacity-20",
            )}
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex w-16 flex-none items-center justify-center border-x border-border">
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
                  "flex h-full w-full items-center justify-center gap-0.5",
                  "text-xs transition-colors hover:bg-accent disabled:opacity-50",
                )}
              >
                <span className="font-bold text-foreground">{displayPage}</span>
                <span className="font-light text-muted-foreground">/</span>
                <span className="font-semibold text-muted-foreground">{totalPageCount}</span>
              </button>
            ) : props.mode === "input" ? (
              <PageInput
                key={`${String(displayPage)}:${String(totalPageCount)}`}
                displayPage={displayPage}
                totalPageCount={totalPageCount}
                onChange={props.onPageIndexChange}
              />
            ) : (
              <span className="text-xs text-foreground">
                {displayPage} / {totalPageCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onPageDown}
            disabled={totalPageCount === 0 || currPageIndex >= totalPageCount - 1}
            aria-label="Next page"
            className={clsx(
              "flex flex-1 items-center justify-center text-muted-foreground",
              "transition-colors hover:bg-accent disabled:opacity-20",
            )}
          >
            <ChevronRight size={14} />
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
          className="fixed inset-0 z-40 bg-foreground/20"
          onClick={() => {
            changeOpen(false);
          }}
        />
      )}
    </>
  );
}
