import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { ChartNoAxesGantt, CircleArrowRight, Loader2 } from "lucide-react";
import clsx from "clsx";
import { showLocalCaughtError } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { PageUnitDiffStats } from "@/route/_authenticated/business/page/page";
import { findNextEditedPageIndex } from "@/route/_authenticated/translator/business/edited-page-navigation";
import type { StatsPage } from "@/route/_authenticated/translator/business/page-statistic/page-unit-stats";
import { PageUnitStatsChart } from "@/route/_authenticated/translator/business/page-statistic/PageUnitStatsChart";

type Props = {
  pages: StatsPage[];
  currentPageId: string;
  isDisabled: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onListPageUnitDiffStats: () => Promise<PageUnitDiffStats[]>;
  onNavigate: (index: number) => Promise<void>;
};

export function ReadOnlyPageActions({
  pages,
  currentPageId,
  isDisabled,
  isOpen,
  onOpenChange,
  onListPageUnitDiffStats,
  onNavigate,
}: Props): TranslatorImportedType0.Element {
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const requestRef = useRef(0);
  const showToast = useToastStore((state) => state.showToast);

  useEffect(
    () => () => {
      requestRef.current += 1;
    },
    [],
  );

  async function handleNavigate(index: number): Promise<void> {
    onOpenChange(false);
    try {
      await onNavigate(index);
    } catch (error) {
      console.error("[PageUnitStats] 页面跳转失败", error);
      showLocalCaughtError(error, showToast, "页面跳转失败，请重试");
    }
  }

  async function handleNextEditedPage(): Promise<void> {
    if (isDisabled || isLoadingNext) return;
    const request = ++requestRef.current;
    setIsLoadingNext(true);
    try {
      const stats = await onListPageUnitDiffStats();
      if (request !== requestRef.current) return;
      const editedIds = stats
        .filter((stat) => stat.editedUnitCount > 0 || stat.proofreaderAppendUnitCount > 0)
        .map((stat) => stat.pageId);
      const nextIndex = findNextEditedPageIndex(
        pages,
        pages.findIndex((page) => page.id === currentPageId),
        editedIds,
      );
      if (nextIndex < 0) {
        showToast(editedIds.length === 0 ? "当前章节没有修改页面" : "后面没有修改页面了", "info");
        return;
      }
      await handleNavigate(nextIndex);
    } catch (error) {
      if (request !== requestRef.current) return;

      console.error("[PageUnitStats] 加载修改页面失败", error);
      showLocalCaughtError(error, showToast, "获取修改页面失败，请重试");
    } finally {
      if (request === requestRef.current) setIsLoadingNext(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Popover.Root open={isOpen} onOpenChange={onOpenChange}>
        <Popover.Trigger asChild>
          <button
            type="button"
            title="页面 unit 统计"
            aria-label="页面 unit 统计"
            disabled={isDisabled || isLoadingNext}
            className={clsx(
              "flex size-8 items-center justify-center rounded-md border",
              "border-border bg-surface-panel text-text-secondary shadow-sm",
              "transition-colors hover:bg-surface-panel hover:text-foreground",
              "focus-visible:outline-border disabled:opacity-60",
              isOpen && "bg-surface-panel text-foreground",
            )}
          >
            <ChartNoAxesGantt size={16} strokeWidth={1.8} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="top"
            align="end"
            sideOffset={6}
            collisionPadding={8}
            aria-label="页面 unit 统计"
            className={clsx(
              "z-60 flex w-76 max-w-[calc(100vw-16px)] flex-col overflow-hidden",
              "max-h-[min(24rem,var(--radix-popover-content-available-height))]",
              "rounded-sm border border-foreground/5 bg-popover shadow-2xl backdrop-blur-md",
              "outline-none",
            )}
          >
            <PageUnitStatsChart
              pages={pages}
              currentPageId={currentPageId}
              isDisabled={isDisabled}
              onLoad={onListPageUnitDiffStats}
              onNavigate={(index) => {
                void handleNavigate(index);
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <button
        type="button"
        title="前进到下一个修改"
        aria-label="前进到下一个修改"
        disabled={isDisabled || isLoadingNext || isOpen}
        onClick={() => {
          void handleNextEditedPage();
        }}
        className={clsx(
          "flex size-8 items-center justify-center rounded-md border",
          "border-border bg-surface-panel text-text-secondary shadow-sm",
          "transition-colors hover:bg-surface-panel hover:text-foreground",
          "focus-visible:outline-border disabled:opacity-60",
        )}
      >
        {isLoadingNext ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <CircleArrowRight size={20} strokeWidth={2.25} />
        )}
      </button>
    </div>
  );
}
