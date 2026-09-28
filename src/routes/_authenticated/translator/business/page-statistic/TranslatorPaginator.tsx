import type { JSX as TranslatorImportedType0 } from "react/jsx-runtime";
import { useMemo, useSyncExternalStore } from "react";
import { Paginator } from "@/shared/component/Paginator";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalCaughtError } from "@/routes/business/request";
import type { Page, PageUnitFlaggedStats } from "@/routes/_authenticated/business/page/page";
import type { UnitInfo } from "@/routes/_authenticated/translator/business/unit/unit";
import {
  createPageFlaggedStatsController,
  pageFlaggedCount,
} from "@/routes/_authenticated/translator/business/page-statistic/page-flagged-stats";

type Props = {
  pages: Page[];
  currentPageIndex: number;
  currentUnits: UnitInfo[] | undefined;
  isEnabled: boolean;
  onLoad: () => Promise<PageUnitFlaggedStats[]>;
  onNavigate: (index: number) => Promise<void>;
};

export function TranslatorPaginator({
  pages,
  currentPageIndex,
  currentUnits,
  isEnabled,
  onLoad,
  onNavigate,
}: Props): TranslatorImportedType0.Element {
  const controller = useMemo(() => createPageFlaggedStatsController(onLoad), [onLoad]);
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const showToast = useToastStore((state) => state.showToast);
  const currentPageId = pages[currentPageIndex]?.id;

  async function refresh(): Promise<void> {
    try {
      await controller.refresh();
    } catch (error) {
      console.error("[PageFlaggedStats] 标记数量加载失败", error);
      showLocalCaughtError(error, showToast, "标记数量加载失败，请重试");
    }
  }

  function handleOpenChange(isOpen: boolean): void {
    if (isOpen && isEnabled) {
      void refresh();
      return;
    }
    controller.cancel();
  }

  return (
    <Paginator
      mode="list"
      currPageIndex={currentPageIndex}
      totalPageCount={pages.length}
      onPageIndexChange={(index) => {
        void onNavigate(index);
      }}
      onPageUp={() => {
        void onNavigate(currentPageIndex - 1);
      }}
      onPageDown={() => {
        void onNavigate(currentPageIndex + 1);
      }}
      onPageListOpenChange={handleOpenChange}
      pageStats={pages.map((page) => {
        const flaggedUnits = isEnabled
          ? pageFlaggedCount(page.id, currentPageId, currentUnits, snapshot.counts)
          : undefined;
        return {
          pageId: page.id,
          totalUnits: page.totalUnitCount,
          translatedUnits: page.translatedUnitCount,
          proofreadUnits: page.proofreadUnitCount,
          ...(flaggedUnits === undefined ? {} : { flaggedUnits }),
        };
      })}
      pageListFooter={
        isEnabled && (
          <>
            {snapshot.isLoading && (
              <p role="status" className="px-3 py-2 text-xs text-stone-500">
                正在刷新标记数量…
              </p>
            )}
            {snapshot.hasError && (
              <div role="status" className="border-t border-stone-200 px-3 py-2 text-xs">
                <p className="text-stone-500">标记数量加载失败，已有数量可能过期。</p>
                <button
                  type="button"
                  onClick={() => {
                    void refresh();
                  }}
                  className="mt-1 cursor-pointer underline focus-visible:outline-stone-500"
                >
                  重试
                </button>
              </div>
            )}
          </>
        )
      }
    />
  );
}
