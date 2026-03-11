import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

type Props = {
  // 0-based，显示时会自动加 1
  currPageIndex: number;
  totalPageCount: number;
  // 跳转到指定页，newPageIndex 是 0-based 的
  // 如果没有提供，则不将页码显示在可交互输入框中，而是直接显示为文本
  onPageIndexChange?: (newPageIndex: number) => void;
  onPageUp: () => void;
  onPageDown: () => void;
};

export default function Paginator({
  currPageIndex,
  totalPageCount,
  onPageIndexChange,
  onPageUp,
  onPageDown,
}: Props) {
  const displayPage = Math.max(0, Math.min(totalPageCount, currPageIndex + 1));
  const isFirst = currPageIndex <= 0;
  const isLast = currPageIndex >= totalPageCount - 1;

  const [inputValue, setInputValue] = useState(displayPage.toString());

  useEffect(() => {
    setInputValue(displayPage.toString());
  }, [displayPage]);

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
    <div
      style={{ opacity: 0.85 }}
      className={clsx(
        "inline-flex items-stretch",
        "h-8 w-32",
        "bg-white/95 backdrop-blur-md",
        "rounded-md shadow-2xl border border-black/5",
        "overflow-hidden select-none",
      )}
    >
      <button
        onClick={onPageUp}
        disabled={isFirst}
        aria-label="Previous page"
        className={clsx(
          "flex items-center justify-center",
          "flex-1",
          "hover:bg-gray-100/80",
          "disabled:opacity-20 disabled:hover:bg-transparent",
          "transition-colors border-none outline-none",
          "active:bg-gray-200/50",
        )}
      >
        <ChevronLeft size={14} className="text-gray-700" />
      </button>

      <div
        className={clsx(
          "flex flex-none items-center justify-center w-16",
          "border-x border-gray-100 bg-gray-50/20",
        )}
      >
        {onPageIndexChange ? (
          <>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={clsx(
                "w-6 h-full text-center text-sm font-bold",
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
            <span className="text-sm text-gray-500 font-semibold w-6 text-center">
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
          "hover:bg-gray-100/80",
          "disabled:opacity-20 disabled:hover:bg-transparent",
          "transition-colors border-none outline-none",
          "active:bg-gray-200/50",
        )}
      >
        <ChevronRight size={14} className="text-gray-700" />
      </button>
    </div>
  );
}
