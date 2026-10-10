import type { JSX } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { CheckCheck, Files, FileType, Loader2, Plus, RefreshCcw } from "lucide-react";
import clsx from "clsx";
import { showLocalCaughtError } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { PageUnitDiffStats } from "@/route/_authenticated/business/page/page";
import {
  mergePageUnitStats,
  pageUnitStatsLimit,
  type StatsPage,
} from "@/route/_authenticated/translator/business/page-statistic/page-unit-stats";

type Props = {
  pages: StatsPage[];
  currentPageId: string;
  isDisabled: boolean;
  onLoad: () => Promise<PageUnitDiffStats[]>;
  onNavigate: (index: number) => void;
};

type LoadState = { status: "loading" | "error" } | { status: "ready"; stats: PageUnitDiffStats[] };

type PageStatsRow = ReturnType<typeof mergePageUnitStats>[number];

function usePageUnitStatsLoad(
  onLoad: Props["onLoad"],
  currentPageId: string,
): {
  load: LoadState;
  currentRowRef: RefObject<HTMLButtonElement | null>;
  handleRetry: () => void;
} {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [revision, setRevision] = useState(0);
  const currentRowRef = useRef<HTMLButtonElement>(null);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    const request = { isCancelled: false };
    void (async () => {
      try {
        const stats = await onLoad();
        if (!request.isCancelled) setLoad({ status: "ready", stats });
      } catch (error) {
        if (request.isCancelled) return;
        setLoad({ status: "error" });
        console.error("[PageUnitStats] 加载页面统计失败", error);
        showLocalCaughtError(error, showToast, "获取页面统计失败，请重试");
      }
    })();
    return () => {
      request.isCancelled = true;
    };
  }, [onLoad, revision, showToast]);

  useEffect(() => {
    if (load.status !== "ready") return;
    const frame = requestAnimationFrame(() => {
      currentRowRef.current?.scrollIntoView({ block: "nearest" });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [load, currentPageId]);

  function handleRetry(): void {
    setLoad({ status: "loading" });
    setRevision((value) => value + 1);
  }

  return { load, currentRowRef, handleRetry };
}

function PageStatsHeader({ limit }: { limit: number }): JSX.Element {
  return (
    <div
      className={clsx(
        "sticky top-0 z-10 grid grid-cols-[1.75rem_minmax(0,1fr)_4.5rem] items-center",
        "h-7 gap-x-2 bg-surface-stone-50 px-2.5 text-[10px] text-text-muted-warm",
      )}
    >
      <span aria-hidden="true" />
      <div aria-hidden="true" title="unit" className="flex justify-between">
        <span>0</span>
        <span>{limit}</span>
      </div>
      <div className="grid grid-cols-3 justify-items-center">
        <span title="翻译" className="text-text-warning">
          <FileType size={12} strokeWidth={1.8} />
        </span>
        <span title="编辑（包含在翻译中）" className="text-text-pink">
          <CheckCheck size={12} strokeWidth={1.8} />
        </span>
        <span title="追加" className="text-(--brand-leaf)">
          <Plus size={12} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

type PageStatsRowProps = {
  row: PageStatsRow;
  scale: number;
  currentPageId: string;
  isDisabled: boolean;
  pages: StatsPage[];
  onNavigate: Props["onNavigate"];
  currentRowRef: RefObject<HTMLButtonElement | null>;
};

function PageStatsRow({
  row,
  scale,
  currentPageId,
  isDisabled,
  pages,
  onNavigate,
  currentRowRef,
}: PageStatsRowProps): JSX.Element {
  const isCurrent = row.pageId === currentPageId;
  const translatedWidth = (row.translatedUnitCount / scale) * 100;
  return (
    <button
      type="button"
      key={row.pageId}
      ref={isCurrent ? currentRowRef : undefined}
      aria-current={isCurrent ? "page" : undefined}
      aria-label={
        `第 ${String(row.index + 1)} 页，翻译 ` +
        `${String(row.translatedUnitCount)}，编辑 ${String(row.editedUnitCount)}` +
        `，追加 ${String(row.proofreaderAppendUnitCount)}`
      }
      disabled={isDisabled}
      onClick={() => {
        onNavigate(pages.findIndex((page) => page.id === row.pageId));
      }}
      className={clsx(
        "group grid w-full grid-cols-[1.75rem_minmax(0,1fr)_4.5rem]",
        "h-7 scroll-mt-7 items-center gap-x-2 px-2.5 text-[11px] transition-colors",
        "[@media(any-pointer:coarse)]:h-9",
        "hover:bg-surface-stone-100 active:bg-surface-stone-200/70 disabled:opacity-50",
        "focus-visible:outline-1 focus-visible:outline-offset-[-1px]",
        "focus-visible:outline-outline-stone-400",
        isCurrent && "bg-surface-stone-100",
      )}
    >
      <span
        className={clsx(
          "text-left",
          isCurrent ? "font-semibold text-ink-stone-800" : "text-text-muted-warm",
        )}
      >
        P{row.index + 1}
      </span>
      <PageStatsBars row={row} translatedWidth={translatedWidth} scale={scale} />
      <PageStatsCounts row={row} isCurrent={isCurrent} />
    </button>
  );
}

function PageStatsBars({
  row,
  translatedWidth,
  scale,
}: {
  row: PageStatsRow;
  translatedWidth: number;
  scale: number;
}): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-full items-center border-x border-line-stone-200/50"
    >
      <span className="absolute inset-y-0 left-1/2 border-l border-line-stone-200/35" />
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
            width: `${String((row.proofreaderAppendUnitCount / scale) * 100)}%`,
          }}
          className="absolute top-0 h-1 rounded-[1px] bg-(--color-unit-stats-append)"
        />
        <span
          data-stat="edited"
          style={{ width: `${String((row.editedUnitCount / scale) * 100)}%` }}
          className={clsx(
            "absolute bottom-0 left-0 h-0.5 rounded-[1px]",
            "bg-(--color-unit-stats-edit)",
          )}
        />
      </span>
    </span>
  );
}

function PageStatsCounts({
  row,
  isCurrent,
}: {
  row: PageStatsRow;
  isCurrent: boolean;
}): JSX.Element {
  const counts = [
    ["translated", row.translatedUnitCount],
    ["edited", row.editedUnitCount],
    ["appended", row.proofreaderAppendUnitCount],
  ] as const;
  return (
    <span className="grid grid-cols-3 text-center">
      {counts.map(([column, count]) => (
        <span
          key={column}
          className={clsx(
            count === 0 ? "text-text-muted-warm" : "text-ink-stone-600",
            isCurrent && count > 0 && "font-medium text-ink-stone-800",
          )}
        >
          {count}
        </span>
      ))}
    </span>
  );
}

function PageStatsRows(
  props: Omit<PageStatsRowProps, "row"> & { rows: PageStatsRow[] },
): JSX.Element {
  return (
    <div>
      {props.rows.map((row) => (
        <PageStatsRow key={row.pageId} {...props} row={row} />
      ))}
    </div>
  );
}

export function PageUnitStatsChart({
  pages,
  currentPageId,
  isDisabled,
  onLoad,
  onNavigate,
}: Props): JSX.Element {
  const { load, currentRowRef, handleRetry } = usePageUnitStatsLoad(onLoad, currentPageId);

  if (load.status !== "ready") {
    return (
      <div
        role={load.status === "error" ? "alert" : "status"}
        aria-label={load.status === "error" ? "统计加载失败" : "正在加载统计"}
        className="flex h-20 items-center justify-center text-text-muted-warm"
      >
        {load.status === "error" ? (
          <button
            type="button"
            aria-label="重试"
            title="重试"
            onClick={handleRetry}
            className={clsx(
              "flex size-8 items-center justify-center rounded-sm transition-colors",
              "hover:bg-surface-stone-100 hover:text-ink-stone-600 focus-visible:outline-outline-stone-400",
            )}
          >
            <RefreshCcw size={14} />
          </button>
        ) : (
          <Loader2 size={14} className="animate-spin" />
        )}
      </div>
    );
  }

  const rows = mergePageUnitStats(pages, load.stats);

  if (rows.length === 0) {
    return (
      <div
        role="status"
        aria-label="当前章节暂无页面"
        className="flex h-20 items-center justify-center text-text-muted-warm"
      >
        <Files size={16} />
      </div>
    );
  }

  const limit = pageUnitStatsLimit(rows);
  const scale = Math.max(1, limit);

  return (
    <div
      role="region"
      aria-label="页面统计详情"
      tabIndex={0}
      className={clsx(
        "min-h-0 overflow-y-auto overscroll-contain pb-1 font-mono tabular-nums",
        "[scrollbar-width:thin]",
      )}
    >
      <PageStatsHeader limit={limit} />
      <PageStatsRows
        rows={rows}
        scale={scale}
        currentPageId={currentPageId}
        isDisabled={isDisabled}
        pages={pages}
        onNavigate={onNavigate}
        currentRowRef={currentRowRef}
      />
    </div>
  );
}
