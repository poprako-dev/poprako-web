import type { JSX } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
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

type NextPageNavigation = {
  isDisabled: boolean;
  isLoadingNext: boolean;
  requestRef: { current: number };
  setIsLoadingNext: Dispatch<SetStateAction<boolean>>;
  onListPageUnitDiffStats: Props["onListPageUnitDiffStats"];
  pages: Props["pages"];
  currentPageId: string;
  handleNavigate: (index: number) => Promise<void>;
  showToast: ReturnType<typeof useToastStore.getState>["showToast"];
};

async function navigateToNextEditedPage(options: NextPageNavigation): Promise<void> {
  const { isDisabled, isLoadingNext } = options;
  if (isDisabled || isLoadingNext) return;
  const request = ++options.requestRef.current;
  options.setIsLoadingNext(true);
  try {
    const stats = await options.onListPageUnitDiffStats();
    if (request !== options.requestRef.current) return;
    const editedIds = stats
      .filter((stat) => stat.editedUnitCount > 0 || stat.proofreaderAppendUnitCount > 0)
      .map((stat) => stat.pageId);
    const nextIndex = findNextEditedPageIndex(
      options.pages,
      options.pages.findIndex((page) => page.id === options.currentPageId),
      editedIds,
    );
    if (nextIndex < 0) {
      options.showToast(
        editedIds.length === 0 ? "当前章节没有修改页面" : "后面没有修改页面了",
        "info",
      );
      return;
    }
    await options.handleNavigate(nextIndex);
  } catch (error) {
    if (request !== options.requestRef.current) return;
    console.error("[PageUnitStats] 加载修改页面失败", error);
    showLocalCaughtError(error, options.showToast, "获取修改页面失败，请重试");
  } finally {
    if (request === options.requestRef.current) options.setIsLoadingNext(false);
  }
}

function useReadOnlyPageNavigation({
  pages,
  currentPageId,
  isDisabled,
  onOpenChange,
  onListPageUnitDiffStats,
  onNavigate,
}: Props): {
  isLoadingNext: boolean;
  handleNavigate: (index: number) => Promise<void>;
  handleNextEditedPage: () => Promise<void>;
} {
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
    await navigateToNextEditedPage({
      isDisabled,
      isLoadingNext,
      requestRef,
      setIsLoadingNext,
      onListPageUnitDiffStats,
      pages,
      currentPageId,
      handleNavigate,
      showToast,
    });
  }

  return { isLoadingNext, handleNavigate, handleNextEditedPage };
}

export function ReadOnlyPageActions({
  pages,
  currentPageId,
  isDisabled,
  isOpen,
  onOpenChange,
  onListPageUnitDiffStats,
  onNavigate,
}: Props): JSX.Element {
  const { isLoadingNext, handleNavigate, handleNextEditedPage } = useReadOnlyPageNavigation({
    pages,
    currentPageId,
    isDisabled,
    isOpen,
    onOpenChange,
    onListPageUnitDiffStats,
    onNavigate,
  });

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
              "border-line-gray-200 bg-surface-white/85 text-ink-gray-700 shadow-sm",
              "transition-colors hover:bg-surface-white hover:text-ink-gray-900",
              "focus-visible:outline-outline-stone-400 disabled:opacity-60",
              isOpen && "bg-surface-white text-ink-gray-900",
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
              "rounded-sm border border-line-black/5 bg-surface-white/95 shadow-2xl backdrop-blur-md",
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
          "border-line-gray-200 bg-surface-white/85 text-ink-gray-700 shadow-sm",
          "transition-colors hover:bg-surface-white hover:text-ink-gray-900",
          "focus-visible:outline-outline-stone-400 disabled:opacity-60",
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
