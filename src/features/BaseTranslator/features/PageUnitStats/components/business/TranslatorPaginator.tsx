import { useMemo, useSyncExternalStore } from "react";
import Paginator from "@/components/ui/Paginator";
import { useToastStore } from "@/components/ui/NotificationToast";
import { showLocalCaughtError } from "@/api/util";
import type { Page, PageUnitFlaggedStats } from "@/types/page";
import type { UnitInfo } from "@/types/unit";
import { createPageFlaggedStatsController, pageFlaggedCount } from "../../pageFlaggedStats";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Props convention.
type Props = {
  pages: Page[];
  currentPageIndex: number;
  currentUnits: UnitInfo[] | undefined;
  isEnabled: boolean;
  onLoad: () => Promise<PageUnitFlaggedStats[]>;
  onNavigate: (index: number) => Promise<void>;
};

export default function TranslatorPaginator({
  pages, currentPageIndex, currentUnits, isEnabled, onLoad, onNavigate,
}: Props) {
  const controller = useMemo(() => createPageFlaggedStatsController(onLoad), [onLoad]);
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const showToast = useToastStore((state) => state.showToast);
  const currentPageId = pages[currentPageIndex]?.id;

  async function refresh() {
    try {
      await controller.refresh();
    } catch (error) {
      // eslint-disable-next-line no-console -- Keep diagnostics with the user-facing error.
      console.error("[PageFlaggedStats] 标记数量加载失败", error);
      showLocalCaughtError(error, showToast, "标记数量加载失败，请重试");
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen && isEnabled) {
      void refresh();
      return;
    }
    controller.cancel();
  }

  return (
    <Paginator
      currPageIndex={currentPageIndex}
      totalPageCount={pages.length}
      onPageIndexChange={(index) => {void onNavigate(index);}}
      onPageUp={() => {void onNavigate(currentPageIndex - 1);}}
      onPageDown={() => {void onNavigate(currentPageIndex + 1);}}
      onPageListOpenChange={handleOpenChange}
      pageStats={pages.map((page) => ({
        pageId: page.id,
        totalUnits: page.totalUnitCount,
        translatedUnits: page.translatedUnitCount,
        proofreadUnits: page.proofreadUnitCount,
        flaggedUnits: isEnabled
          ? pageFlaggedCount(page.id, currentPageId, currentUnits, snapshot.counts)
          : undefined,
      }))}
      pageListFooter={isEnabled && (
        <>
          {snapshot.isLoading && (
            <p role="status" className="px-3 py-2 text-xs text-stone-500">正在刷新标记数量…</p>
          )}
          {snapshot.hasError && (
            <div role="status" className="border-t border-stone-200 px-3 py-2 text-xs">
              <p className="text-stone-500">标记数量加载失败，已有数量可能过期。</p>
              <button
                type="button"
                onClick={() => {void refresh();}}
                className="mt-1 cursor-pointer underline focus-visible:outline-stone-500"
              >
                重试
              </button>
            </div>
          )}
        </>
      )}
    />
  );
}
