import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

export type PageStat = {
  totalUnits: number;
  translatedUnits: number;
  proofreadUnits: number;
};

type Props = {
  // 0-based，显示时会自动加 1
  currPageIndex: number;
  totalPageCount: number;
  // 跳转到指定页，newPageIndex 是 0-based 的
  // 如果没有提供，则不将页码显示在可交互输入框中，而是直接显示为文本
  onPageIndexChange?: (newPageIndex: number) => void;
  onPageUp: () => void;
  onPageDown: () => void;
  // 每页的 unit 统计，提供后中间区域变为可点击并展开页列表下拉
  pageStats?: PageStat[];
};

export default function Paginator({
  currPageIndex,
  totalPageCount,
  onPageIndexChange,
  onPageUp,
  onPageDown,
  pageStats,
}: Props) {
  const displayPage = Math.max(0, Math.min(totalPageCount, currPageIndex + 1));
  const isFirst = currPageIndex <= 0;
  const isLast = currPageIndex >= totalPageCount - 1;

  const [inputValue, setInputValue] = useState(displayPage.toString());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(displayPage.toString());
  }, [displayPage]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isDropdownOpen]);

  const commitInput = useCallback(
    (v: string) => {
      if (!onPageIndexChange) return;
      const page = parseInt(v, 10);
      if (isNaN(page)) {
        setInputValue(displayPage.toString());
        return;
      }
      const clamped = Math.min(Math.max(page - 1, 0), totalPageCount - 1);
      onPageIndexChange(clamped);
    },
    [onPageIndexChange, displayPage, totalPageCount],
  );

  return (
    <div className="relative inline-block select-none" ref={containerRef}>
      <div
        style={{ opacity: 0.85 }}
        className={clsx(
          "inline-flex items-stretch",
          "h-8 w-24",
          "bg-white/95 backdrop-blur-md",
          "rounded-sm shadow-2xl",
          "overflow-hidden",
        )}
      >
        <button
          onClick={onPageUp}
          disabled={isFirst}
          aria-label="Previous page"
          className={clsx(
            "flex items-center justify-center",
            "flex-1",
            "hover:bg-stone-400/40",
            "disabled:opacity-20 disabled:hover:bg-transparent",
            "transition-colors border-none outline-none",
            "active:bg-stone-400/60",
            "hover:[&>svg]:text-stone-950",
            "hover:shadow-inner",
          )}
        >
          <ChevronLeft size={14} className="text-gray-600" />
        </button>

        <div
          className={clsx(
            "flex flex-none items-center justify-center w-16",
            "border-x border-gray-100 bg-gray-50/20",
          )}
        >
          {pageStats ? (
            <button
              onClick={() => setIsDropdownOpen((v) => !v)}
              aria-label="Open page list"
              aria-expanded={isDropdownOpen}
              className={clsx(
                "flex items-center justify-center gap-0.5",
                "w-full h-full",
                "hover:bg-stone-400/30 transition-colors",
                "border-none outline-none",
                "active:bg-stone-400/50",
                "hover:shadow-inner",
              )}
            >
              <span className="text-xs text-gray-900 font-bold">
                {displayPage}
              </span>
              <span className="text-xs text-gray-300 font-light">/</span>
              <span className="text-xs text-gray-500 font-semibold">
                {totalPageCount}
              </span>
            </button>
          ) : onPageIndexChange ? (
            <>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={clsx(
                  "w-6 h-full text-center text-xs font-bold",
                  "bg-transparent border-none focus:outline-none",
                  "text-gray-900 p-0",
                )}
                onBlur={(e) => commitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitInput(e.currentTarget.value);
                    e.currentTarget.blur();
                  }
                }}
                aria-label="Current page"
              />
              <span className="text-xs text-gray-300 font-light select-none">
                /
              </span>
              <span className="text-xs text-gray-500 font-semibold w-6 text-center">
                {totalPageCount}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-900 font-bold w-6 text-center">
                {displayPage}
              </span>
              <span className="text-xs text-gray-300 font-light select-none">
                /
              </span>
              <span className="text-sm text-gray-500 font-semibold w-6 text-center">
                {totalPageCount}
              </span>
            </>
          )}
        </div>

        <button
          onClick={onPageDown}
          disabled={isLast}
          aria-label="Next page"
          className={clsx(
            "flex items-center justify-center",
            "flex-1",
            "hover:bg-stone-400/40",
            "disabled:opacity-20 disabled:hover:bg-transparent",
            "transition-colors border-none outline-none",
            "active:bg-stone-400/60",
            "hover:[&>svg]:text-stone-950",
            "hover:shadow-inner",
          )}
        >
          <ChevronRight size={14} className="text-gray-600" />
        </button>
      </div>

      {isDropdownOpen && pageStats && (
        <div
          className={clsx(
            "absolute top-full right-0 mt-1 z-50",
            "bg-white/95 backdrop-blur-md",
            "rounded-sm shadow-2xl border border-black/5",
            "max-h-60 overflow-y-auto",
            "w-44",
          )}
        >
          {pageStats.map((stat, idx) => {
            const dotColor =
              stat.totalUnits > 0 && stat.proofreadUnits >= stat.totalUnits
                ? "bg-green-500"
                : stat.totalUnits > 0 && stat.translatedUnits >= stat.totalUnits
                  ? "bg-orange-400"
                  : "bg-gray-400";
            return (
            <button
              key={idx}
              onClick={() => {
                onPageIndexChange?.(idx);
                setIsDropdownOpen(false);
              }}
              className={clsx(
                "w-full flex items-center justify-between px-3 py-1.5",
                "text-xs hover:bg-stone-100 transition-colors active:bg-stone-200",
                "border-none outline-none",
                idx === currPageIndex && "bg-stone-100",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
                <span className="text-stone-700 font-medium">P{idx + 1}</span>
              </span>
              <span className="flex items-center font-mono text-[11px]">
                <span className="text-stone-400">{stat.totalUnits}</span>
                <span className="text-stone-300 mx-px">/</span>
                <span className="text-orange-400">{stat.translatedUnits}</span>
                <span className="text-stone-300 mx-px">/</span>
                <span className="text-pink-400">{stat.proofreadUnits}</span>
              </span>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
