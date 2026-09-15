import type { Page, PageUnitDiffStats } from "@/types/page";

export type StatsPage = Pick<Page, "id" | "index" | "translatedUnitCount">;

export function mergePageUnitStats(
  pages: StatsPage[],
  stats: PageUnitDiffStats[],
): PageUnitDiffStats[] {
  const byPageId = new Map(stats.map((stat) => [stat.pageId, stat]));
  // eslint-disable-next-line unicorn/no-array-sort -- ES2022 target; sort a fresh array.
  return [...pages].sort((left, right) => left.index - right.index).map((page) => {
    const stat = byPageId.get(page.id);
    return {
      pageId: page.id,
      index: page.index,
      translatedUnitCount: stat?.translatedUnitCount ?? page.translatedUnitCount,
      editedUnitCount: stat?.editedUnitCount ?? 0,
      proofreaderAppendUnitCount: stat?.proofreaderAppendUnitCount ?? 0,
    };
  });
}

export function pageUnitStatsLimit(stats: PageUnitDiffStats[]): number {
  return Math.max(0, ...stats.map((stat) =>
    stat.translatedUnitCount + stat.proofreaderAppendUnitCount));
}
