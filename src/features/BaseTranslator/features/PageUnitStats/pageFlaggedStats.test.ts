import { describe, expect, test, vi } from "vitest";
import { createUnit } from "@/types/unit";
import type { PageUnitFlaggedStats } from "@/types/page";
import { createPageFlaggedStatsController, pageFlaggedCount } from "./pageFlaggedStats";

const stats: PageUnitFlaggedStats[] = [{ pageId: "p3", index: 2, flaggedUnitCount: 3 }];

function deferred() {
  let resolve: (stats: PageUnitFlaggedStats[]) => void;
  // eslint-disable-next-line unicorn/prefer-promise-with-resolvers -- ES2022 target.
  const promise = new Promise<PageUnitFlaggedStats[]>((done) => {resolve = done;});
  return { promise, resolve: (value: PageUnitFlaggedStats[]) => {resolve(value);} };
}

describe("page flag statistics", () => {
  test("uses page identity and distinguishes unknown counts from zero", async () => {
    const controller = createPageFlaggedStatsController(() => Promise.resolve(stats));
    expect(pageFlaggedCount("p1", undefined, undefined, controller.getSnapshot().counts))
      .toBeUndefined();
    await controller.refresh();
    const { counts } = controller.getSnapshot();
    expect(pageFlaggedCount("p1", undefined, undefined, counts)).toBe(0);
    expect(pageFlaggedCount("p3", undefined, undefined, counts)).toBe(3);
  });

  test("current drafts override statistics, including creation, clearing and deletion", () => {
    const counts = new Map([["p1", 7], ["p3", 3]]);
    const unit = { ...createUnit(0, 0, true), isFlagged: true };
    expect(pageFlaggedCount("p1", "p1", [unit], counts)).toBe(1);
    expect(pageFlaggedCount("p1", "p1", [unit, { ...unit, id: "new" }], counts)).toBe(2);
    expect(pageFlaggedCount("p1", "p1", [{ ...unit, isFlagged: false }], counts)).toBe(0);
    expect(pageFlaggedCount("p1", "p1", [], counts)).toBe(0);
    expect(pageFlaggedCount("p3", "p1", [unit], counts)).toBe(3);
    expect(pageFlaggedCount("p3", "p3", undefined, counts)).toBe(3);
  });

  test("failed refresh preserves counts, and successful empty retry clears them", async () => {
    const load = vi.fn(() => Promise.resolve(stats));
    const controller = createPageFlaggedStatsController(load);
    await controller.refresh();
    const previous = controller.getSnapshot().counts;
    load.mockRejectedValueOnce(new Error("offline"));
    await expect(controller.refresh()).rejects.toThrow("offline");
    expect(controller.getSnapshot()).toMatchObject({ counts: previous, hasError: true });
    load.mockResolvedValueOnce([]);
    await controller.refresh();
    expect(controller.getSnapshot()).toMatchObject({ counts: new Map(), hasError: false });
  });

  test("old responses cannot overwrite newer requests or a closed chapter", async () => {
    const first = deferred();
    const load = vi.fn(() => Promise.resolve(stats)).mockReturnValueOnce(first.promise);
    const controller = createPageFlaggedStatsController(load);
    const older = controller.refresh();
    await controller.refresh();
    first.resolve([]);
    await older;
    expect(controller.getSnapshot().counts?.get("p3")).toBe(3);

    const last = deferred();
    load.mockReturnValueOnce(last.promise);
    const unsubscribe = controller.subscribe(vi.fn());
    const pending = controller.refresh();
    unsubscribe();
    last.resolve([]);
    await pending;
    expect(controller.getSnapshot().counts?.get("p3")).toBe(3);
    expect(controller.getSnapshot().isLoading).toBe(false);
  });
});
