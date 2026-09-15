import { useEffect, useRef, useState } from "react";
import { CheckCheck, FileType, Files, Loader2, Plus, RefreshCcw } from "lucide-react";
import clsx from "clsx";
import { showLocalCaughtError } from "@/api/util";
import { useToastStore } from "@/components/ui/NotificationToast";
import type { PageUnitDiffStats } from "@/types/page";
import { mergePageUnitStats, pageUnitStatsLimit, type StatsPage } from "../../pageUnitStats";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Props convention.
type Props = {
  pages: StatsPage[];
  currentPageId: string;
  isDisabled: boolean;
  onLoad: () => Promise<PageUnitDiffStats[]>;
  onNavigate: (index: number) => void;
};

type LoadState =
  | { status: "loading" | "error" }
  | { status: "ready"; stats: PageUnitDiffStats[] };

export default function PageUnitStatsChart({
  pages, currentPageId, isDisabled, onLoad, onNavigate,
}: Props) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [revision, setRevision] = useState(0);
  const currentRowRef = useRef<HTMLButtonElement>(null);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const request = { isCancelled: false };
    void (async () => {
      try {
        const stats = await onLoad();
        if (!request.isCancelled) {setLoad({ status: "ready", stats });}
      } catch (error) {
        if (request.isCancelled) {return;}
        setLoad({ status: "error" });
        // eslint-disable-next-line no-console -- Include developer diagnostics with the toast.
        console.error("[PageUnitStats] 加载页面统计失败", error);
        showLocalCaughtError(error, showToast, "获取页面统计失败，请重试");
      }
    })();
    return () => {request.isCancelled = true;};
  }, [onLoad, revision, showToast]);

  useEffect(() => {
    if (load.status !== "ready") {return;}
    const frame = requestAnimationFrame(() => {
      currentRowRef.current?.scrollIntoView({ block: "nearest" });
    });
    return () => {cancelAnimationFrame(frame);};
  }, [load, currentPageId]);

  function handleRetry() {
    setLoad({ status: "loading" });
    setRevision((value) => value + 1);
  }

  if (load.status !== "ready") {
    return (
      <div
        role={load.status === "error" ? "alert" : "status"}
        aria-label={load.status === "error" ? "统计加载失败" : "正在加载统计"}
        className="flex h-20 items-center justify-center text-stone-400"
      >
        {load.status === "error" ? (
          <button
            type="button"
            aria-label="重试"
            title="重试"
            onClick={handleRetry}
            className={clsx(
              "flex size-8 items-center justify-center rounded-sm transition-colors",
              "hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-stone-400",
            )}
          >
            <RefreshCcw size={14} />
          </button>
        ) : <Loader2 size={14} className="animate-spin" />}
      </div>
    );
  }

  const rows = mergePageUnitStats(pages, load.stats);

  if (rows.length === 0) {
    return (
      <div
        role="status"
        aria-label="当前章节暂无页面"
        className="flex h-20 items-center justify-center text-stone-300"
      >
        <Files size={16} />
      </div>
    );
  }

  const limit = pageUnitStatsLimit(rows);
  const scale = Math.max(1, limit);

  return (
    <div
      className={clsx(
        "min-h-0 overflow-y-auto overscroll-contain pb-1 font-mono tabular-nums",
        "[scrollbar-width:thin]",
      )}
    >
      <div
        className={clsx(
          "sticky top-0 z-10 grid grid-cols-[1.75rem_minmax(0,1fr)_4.5rem] items-center",
          "h-7 gap-x-2 bg-stone-50 px-2.5 text-[10px] text-stone-400",
        )}
      >
        <span aria-hidden="true" />
        <div aria-hidden="true" title="unit" className="flex justify-between">
          <span>0</span>
          <span>{limit}</span>
        </div>
        <div className="grid grid-cols-3 justify-items-center">
          <span title="翻译" className="text-(--color-unit-stats-translate)">
            <FileType size={12} strokeWidth={1.8} />
          </span>
          <span title="编辑（包含在翻译中）" className="text-(--color-unit-stats-edit)">
            <CheckCheck size={12} strokeWidth={1.8} />
          </span>
          <span title="追加" className="text-(--color-green-500)">
            <Plus size={12} strokeWidth={1.8} />
          </span>
        </div>
      </div>
      <div>
        {rows.map((row) => {
          const isCurrent = row.pageId === currentPageId;
          const translatedWidth = row.translatedUnitCount / scale * 100;
          return (
            <button
              type="button"
              key={row.pageId}
              ref={isCurrent ? currentRowRef : undefined}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={`第 ${String(row.index + 1)} 页，翻译 `
                + `${String(row.translatedUnitCount)}，编辑 ${String(row.editedUnitCount)}`
                + `，追加 ${String(row.proofreaderAppendUnitCount)}`}
              disabled={isDisabled}
              onClick={() => {onNavigate(pages.findIndex((page) => page.id === row.pageId));}}
              className={clsx(
                "group grid w-full grid-cols-[1.75rem_minmax(0,1fr)_4.5rem]",
                "h-7 scroll-mt-7 items-center gap-x-2 px-2.5 text-[11px] transition-colors",
                "[@media(any-pointer:coarse)]:h-9",
                "hover:bg-stone-100 active:bg-stone-200/70 disabled:opacity-50",
                "focus-visible:outline-1 focus-visible:outline-offset-[-1px]",
                "focus-visible:outline-stone-400",
                isCurrent && "bg-stone-100",
              )}
            >
              <span
                className={clsx(
                  "text-left",
                  isCurrent ? "font-semibold text-stone-800" : "text-stone-500",
                )}
              >
                P{row.index + 1}
              </span>
              <span
                aria-hidden="true"
                className="relative flex h-full items-center border-x border-stone-200/50"
              >
                <span className="absolute inset-y-0 left-1/2 border-l border-stone-200/35" />
                <span className="relative h-2 w-full">
                  <span
                    data-stat="translated"
                    style={{ width: `${String(translatedWidth)}%` }}
                    className={clsx(
                      "absolute left-0 top-0 h-1 rounded-[1px]",
                      "bg-(--color-unit-stats-translate)",
                    )}
                  />
                  <span
                    data-stat="appended"
                    style={{
                      left: `${String(translatedWidth)}%`,
                      width: `${String(row.proofreaderAppendUnitCount / scale * 100)}%`,
                    }}
                    className={clsx(
                      "absolute top-0 h-1 rounded-[1px] bg-(--color-unit-stats-append)",
                    )}
                  />
                  <span
                    data-stat="edited"
                    style={{ width: `${String(row.editedUnitCount / scale * 100)}%` }}
                    className={clsx(
                      "absolute bottom-0 left-0 h-0.5 rounded-[1px]",
                      "bg-(--color-unit-stats-edit)",
                    )}
                  />
                </span>
              </span>
              <span className="grid grid-cols-3 text-center">
                {([
                  ["translated", row.translatedUnitCount],
                  ["edited", row.editedUnitCount],
                  ["appended", row.proofreaderAppendUnitCount],
                ] as const).map(([column, count]) => (
                  <span
                    key={column}
                    className={clsx(
                      count === 0 ? "text-stone-300" : "text-stone-600",
                      isCurrent && count > 0 && "font-medium text-stone-800",
                    )}
                  >
                    {count}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
