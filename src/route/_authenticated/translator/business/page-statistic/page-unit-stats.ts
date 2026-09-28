import type { Page, PageUnitDiffStats } from "@/route/_authenticated/business/page/page";

export type StatsPage = Pick<Page, "id" | "index" | "translatedUnitCount">;

export function mergePageUnitStats(
  pages: StatsPage[],
  stats: PageUnitDiffStats[],
): PageUnitDiffStats[] {
  const byPageId = new Map(stats.map((stat) => [stat.pageId, stat]));
  return [...pages]
    .sort((left, right) => left.index - right.index)
    .map((page) => {
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
  return Math.max(
    0,
    ...stats.map((stat) => stat.translatedUnitCount + stat.proofreaderAppendUnitCount),
  );
}
