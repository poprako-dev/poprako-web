import { describe, expect, test } from "vitest";
import type { ChapterWorkflowRecord } from "@/types/chapterWorkflowRecord";
import {
  appendWorkflowRecordPage,
  mergeWorkflowRecordHead,
} from "./useComicDetailWorkflowRecords";

function record(id: string, createdAt: number): ChapterWorkflowRecord {
  return {
    id,
    chapterId: "chapter_1",
    actorUserId: null,
    event: { kind: "chapter_created" },
    createdAt,
  };
}

describe("workflow record page merging", () => {
  test("keeps refreshed newest-first order and deduplicates overlap", () => {
    const existing = [record("r3", 3), record("r2", 2), record("r1", 1)];
    const refreshed = [record("r5", 5), record("r4", 4), record("r3", 3)];

    expect(mergeWorkflowRecordHead(refreshed, existing).map((item) => item.id))
      .toEqual(["r5", "r4", "r3", "r2", "r1"]);
  });

  test("appends older records without changing server order", () => {
    const existing = [record("r5", 5), record("r4", 4), record("r3", 3)];
    const older = [record("r3", 3), record("r2", 2), record("r1", 1)];

    expect(appendWorkflowRecordPage(existing, older).map((item) => item.id))
      .toEqual(["r5", "r4", "r3", "r2", "r1"]);
  });
});
