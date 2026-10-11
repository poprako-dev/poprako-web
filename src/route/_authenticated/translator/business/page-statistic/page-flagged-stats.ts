import type { PageUnitFlaggedStats } from "@/route/_authenticated/business/page/page";
import { isUnitFlagged, type UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";

export type FlaggedStatsSnapshot = {
  counts: ReadonlyMap<string, number> | undefined;
  isLoading: boolean;
  hasError: boolean;
};

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

function flaggedCounts(stats: PageUnitFlaggedStats[]): ReadonlyMap<string, number> {
  return new Map(stats.map((stat) => [stat.pageId, stat.flaggedUnitCount]));
}

function subscribeToFlaggedStats(
  listeners: Set<() => void>,
  cancel: () => void,
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) cancel();
  };
}

export function createPageFlaggedStatsController(load: () => Promise<PageUnitFlaggedStats[]>): {
  getSnapshot: () => FlaggedStatsSnapshot;
  subscribe: (listener: () => void) => () => void;
  refresh: () => Promise<void>;
  cancel: () => void;
} {
  let snapshot: FlaggedStatsSnapshot = {
    counts: undefined,
    isLoading: false,
    hasError: false,
  };
  let generation = 0;
  const listeners = new Set<() => void>();

  function publish(changes: Partial<FlaggedStatsSnapshot>): void {
    snapshot = { ...snapshot, ...changes };
    for (const listener of listeners) listener();
  }

  function cancel(): void {
    generation += 1;
    if (snapshot.isLoading) publish({ isLoading: false });
  }

  async function refresh(): Promise<void> {
    const request = ++generation;
    publish({ isLoading: true, hasError: false });
    try {
      const stats = await load();
      if (request !== generation) return;
      publish({
        counts: flaggedCounts(stats),
        isLoading: false,
      });
    } catch (error) {
      if (request !== generation) return;
      publish({ isLoading: false, hasError: true });
      throw error;
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => subscribeToFlaggedStats(listeners, cancel, listener),
    refresh,
    cancel,
  };
}
