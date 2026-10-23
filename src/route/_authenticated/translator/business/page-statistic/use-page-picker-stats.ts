import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Page } from "@/route/_authenticated/business/page/page";
import type { PageStat } from "@/shared/component/Paginator";
import type { DraftStore } from "../persistence/draft-store";
import type { UnitInfo } from "../unit/unit";
import { countFlaggedUnits, type FlaggedStatsSnapshot } from "./page-flagged-stats";

type Args = {
  drafts: DraftStore | undefined;
  pages: Page[];
  currentPageId: string | undefined;
  currentPageHasDraft: boolean | undefined;
  currentUnits: UnitInfo[] | undefined;
  counts: FlaggedStatsSnapshot["counts"];
  isEnabled: boolean;
  isOpen: boolean;
};

function emptySubscribe(): () => void {
  return () => {
    /* No store to unsubscribe from. */
  };
}

function useDraftPageIds(drafts: DraftStore | undefined): ReadonlySet<string> {
  const getSnapshot = useCallback(
    () => JSON.stringify(Object.keys(drafts?.getState().drafts ?? {}).sort()),
    [drafts],
  );
  const key = useSyncExternalStore(drafts?.subscribe ?? emptySubscribe, getSnapshot);
  return useMemo(() => new Set(JSON.parse(key) as string[]), [key]);
}

export function usePagePickerStats(args: Args): readonly PageStat[] {
  const { drafts, pages, currentPageId, currentPageHasDraft, currentUnits } = args;
  const { counts, isEnabled, isOpen } = args;
  const draftPageIds = useDraftPageIds(drafts);
  const currentFlaggedCount =
    isOpen && isEnabled && currentUnits !== undefined ? countFlaggedUnits(currentUnits) : undefined;
  return useMemo(
    () =>
      pages.map((page) => {
        const flaggedUnits = !isEnabled
          ? undefined
          : page.id === currentPageId && currentFlaggedCount !== undefined
            ? currentFlaggedCount
            : (counts?.get(page.id) ?? (counts === undefined ? undefined : 0));
        return {
          pageId: page.id,
          hasLocalDraft:
            draftPageIds.has(page.id) ||
            (page.id === currentPageId && currentPageHasDraft === true),
          totalUnits: page.totalUnitCount,
          translatedUnits: page.translatedUnitCount,
          proofreadUnits: page.proofreadUnitCount,
          ...(flaggedUnits === undefined ? {} : { flaggedUnits }),
        };
      }),
    [
      pages,
      currentPageId,
      currentPageHasDraft,
      draftPageIds,
      currentFlaggedCount,
      counts,
      isEnabled,
    ],
  );
}
