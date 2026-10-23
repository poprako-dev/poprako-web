import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { usePagePickerStats } from "./use-page-picker-stats";
import { createDraftStore } from "../persistence/draft-store";
import type { DraftRecord } from "../persistence/draft-record";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { mockProject } from "../test/base-translator-story-data";
import { undoUnit } from "../test/unit-undo-fixture";

function record(revision = 0): DraftRecord {
  return { version: 1, revision, units: [], baseline: [], pending: [], identities: [] };
}

test("draft content and storage errors do not rerender picker stats; page presence does", async () => {
  const drafts = createDraftStore("stats-user", "stats-chapter", createDraftDatabaseFixture());
  await drafts.ready;
  drafts.update("page-2", record());
  let renders = 0;
  const { result } = renderHook(() => {
    renders += 1;
    return usePagePickerStats({
      drafts,
      pages: mockProject.pages,
      currentPageId: "page-1",
      currentPageHasDraft: false,
      currentUnits: [],
      counts: undefined,
      isEnabled: true,
      isOpen: false,
    });
  });
  const initial = result.current;
  const initialRenders = renders;
  act(() => {
    drafts.update("page-2", record(1));
    drafts.setState({ errors: { "page-2": "storage failed" } });
  });
  expect(renders).toBe(initialRenders);
  expect(result.current).toBe(initial);
  act(() => {
    drafts.update("page-3", record());
  });
  expect(result.current.find((page) => page.pageId === "page-3")?.hasLocalDraft).toBe(true);
  act(() => {
    drafts.update("page-2", undefined);
  });
  expect(result.current.find((page) => page.pageId === "page-2")?.hasLocalDraft).toBe(false);
});

test("text edits preserve derived stats closed and open; relevant draft and flag changes update", () => {
  const args = {
    drafts: undefined,
    pages: mockProject.pages,
    currentPageId: "page-1",
    currentPageHasDraft: true,
    currentUnits: [undoUnit("u", "first")],
    counts: new Map([
      ["page-1", 9],
      ["page-2", 3],
    ]),
    isEnabled: true,
    isOpen: false,
  };
  const { result, rerender } = renderHook(usePagePickerStats, { initialProps: args });
  const closed = result.current;
  const unit = undoUnit("u", "edited");
  const currentUnits = [unit];
  rerender({ ...args, currentUnits });
  expect(result.current).toBe(closed);
  rerender({ ...args, currentUnits, isOpen: true });
  expect(result.current[0]?.flaggedUnits).toBe(0);
  expect(result.current[1]?.flaggedUnits).toBe(3);
  const open = result.current;
  rerender({ ...args, currentUnits: [undoUnit("u", "more text")], isOpen: true });
  expect(result.current).toBe(open);
  rerender({ ...args, currentUnits: [{ ...unit, isFlagged: true }], isOpen: true });
  expect(result.current[0]?.flaggedUnits).toBe(1);
  rerender({ ...args, currentPageHasDraft: false, isEnabled: false });
  expect(result.current[0]?.hasLocalDraft).toBe(false);
  expect(result.current[0]?.flaggedUnits).toBeUndefined();
});
