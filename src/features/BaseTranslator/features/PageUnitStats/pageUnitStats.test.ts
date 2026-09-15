import { describe, expect, test } from "vitest";
import { mergePageUnitStats, pageUnitStatsLimit, type StatsPage } from "./pageUnitStats";
import type { PageUnitDiffStats } from "@/types/page";

const pages: StatsPage[] = [
  { id: "page-3", index: 2, translatedUnitCount: 8 },
  { id: "page-1", index: 0, translatedUnitCount: 0 },
  { id: "page-2", index: 1, translatedUnitCount: 12 },
];

const diff: PageUnitDiffStats = {
  pageId: "page-2", index: 1, translatedUnitCount: 10,
  editedUnitCount: 3, proofreaderAppendUnitCount: 2,
};
const stats = [diff];

describe("page unit statistics", () => {
  test("keeps every page in chapter order without changing the source", () => {
    const source = structuredClone(pages);
    const merged = mergePageUnitStats(pages, stats);
    expect(merged.map((row) => row.pageId)).toEqual(["page-1", "page-2", "page-3"]);
    expect(merged[0]).toEqual({
      pageId: "page-1", index: 0, translatedUnitCount: 0,
      editedUnitCount: 0, proofreaderAppendUnitCount: 0,
    });
    expect(pages).toEqual(source);
  });

  test("uses all fresh counts and falls back only for pages without a diff", () => {
    const merged = mergePageUnitStats(pages, stats);
    expect(merged[1]).toEqual(stats[0]);
    expect(merged[2]).toEqual({
      pageId: "page-3", index: 2, translatedUnitCount: 8,
      editedUnitCount: 0, proofreaderAppendUnitCount: 0,
    });
  });

  test("keeps append-only pages separate from initial translations", () => {
    const merged = mergePageUnitStats(pages, [{
      pageId: "page-3", index: 2, translatedUnitCount: 0,
      editedUnitCount: 0, proofreaderAppendUnitCount: 8,
    }]);
    expect(merged[2]?.translatedUnitCount).toBe(0);
    expect(merged[2]?.proofreaderAppendUnitCount).toBe(8);
  });

  test("ignores rows outside the chapter and keeps canonical page positions", () => {
    const merged = mergePageUnitStats(pages, [
      { ...diff, pageId: "removed" },
      { ...diff, index: 80 },
    ]);
    expect(merged).toHaveLength(3);
    expect(merged[1]?.index).toBe(1);
  });

  test("scales translation plus append without adding edits twice", () => {
    expect(pageUnitStatsLimit([{
      pageId: "page-1", index: 0, translatedUnitCount: 20,
      editedUnitCount: 20, proofreaderAppendUnitCount: 0,
    }])).toBe(20);
    expect(pageUnitStatsLimit(stats)).toBe(12);
  });

  test("uses the exact longest bar without rounding up or adding padding", () => {
    expect(pageUnitStatsLimit([
      diff,
      { ...diff, pageId: "page-3", translatedUnitCount: 21, proofreaderAppendUnitCount: 2 },
    ])).toBe(23);
    expect(pageUnitStatsLimit([
      { ...diff, translatedUnitCount: 0, editedUnitCount: 0, proofreaderAppendUnitCount: 6 },
    ])).toBe(6);
  });

  test("keeps the maximum at zero for empty chapters and all-zero pages", () => {
    expect(mergePageUnitStats([], stats)).toEqual([]);
    expect(pageUnitStatsLimit([])).toBe(0);
    expect(pageUnitStatsLimit(mergePageUnitStats([
      { id: "page-1", index: 0, translatedUnitCount: 0 },
    ], []))).toBe(0);
  });
});
