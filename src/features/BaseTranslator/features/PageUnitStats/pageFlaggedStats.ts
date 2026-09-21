import type { PageUnitFlaggedStats } from "@/types/page";
import { isUnitFlagged, type UnitInfo } from "@/types/unit";

export interface FlaggedStatsSnapshot {
  counts: ReadonlyMap<string, number> | undefined;
  isLoading: boolean;
  hasError: boolean;
}

export function countFlaggedUnits(units: UnitInfo[]): number {
  return units.filter((unit) => isUnitFlagged(unit)).length;
}

export function pageFlaggedCount(
  pageId: string,
  currentPageId: string | undefined,
  currentUnits: UnitInfo[] | undefined,
  counts: FlaggedStatsSnapshot["counts"],
): number | undefined {
  if (pageId === currentPageId && currentUnits !== undefined) {
    return countFlaggedUnits(currentUnits);
  }
  return counts === undefined ? undefined : (counts.get(pageId) ?? 0);
}

export function createPageFlaggedStatsController(load: () => Promise<PageUnitFlaggedStats[]>) {
  let snapshot: FlaggedStatsSnapshot = {
    counts: undefined,
    isLoading: false,
    hasError: false,
  };
  let generation = 0;
  const listeners = new Set<() => void>();

  function publish(changes: Partial<FlaggedStatsSnapshot>) {
    snapshot = { ...snapshot, ...changes };
    for (const listener of listeners) {listener();}
  }

  function cancel() {
    generation += 1;
    if (snapshot.isLoading) {publish({ isLoading: false });}
  }

  async function refresh() {
    const request = ++generation;
    publish({ isLoading: true, hasError: false });
    try {
      const stats = await load();
      if (request !== generation) {return;}
      publish({
        counts: new Map(stats.map((stat) => [stat.pageId, stat.flaggedUnitCount])),
        isLoading: false,
      });
    } catch (error) {
      if (request !== generation) {return;}
      publish({ isLoading: false, hasError: true });
      throw error;
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {cancel();}
      };
    },
    refresh,
    cancel,
  };
}
