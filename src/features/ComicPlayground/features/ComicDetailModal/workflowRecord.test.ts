import { describe, expect, test } from "vitest";
import type {
  ChapterWorkflowRecord,
  ChapterWorkflowRecordEvent,
} from "@/types/chapterWorkflowRecord";
import {
  formatWorkflowRecordEvent,
  formatWorkflowRecordTime,
  presentWorkflowRecordEvent,
  shortWorkflowRecordUserId,
  workflowRecordUserIds,
} from "./workflowRecord";

const userLabel = (userId: string) => ({
  actor_1: "Mori",
  subject_1: "Aki",
})[userId] ?? userId;

describe("formatWorkflowRecordEvent", () => {
  test.each<[ChapterWorkflowRecordEvent, string]>([
    [{ kind: "chapter_created" }, "章节创建：创建了章节"],
    [
      {
        kind: "chapter_subtitle_updated",
        data: { previousSubtitle: "", nextSubtitle: "终幕" },
      },
      "章节副标题修改：将“无副标题”修改为“终幕”",
    ],
    [{ kind: "chapter_pinned" }, "章节置顶：设为置顶章节"],
    [{ kind: "chapter_unpinned" }, "取消章节置顶：取消置顶"],
    [
      {
        kind: "assignment_created",
        data: { subjectUserId: "subject_1", roles: 2 },
      },
      "章节分工添加：为 Aki 添加了翻译分工",
    ],
    [
      {
        kind: "assignment_roles_updated",
        data: {
          subjectUserId: "subject_1",
          previousRoles: 2,
          nextRoles: 6,
        },
      },
      "章节分工调整：将 Aki 的分工由“翻译”调整为“翻译、校对”",
    ],
    [
      {
        kind: "assignment_deleted",
        data: { subjectUserId: "subject_1", previousRoles: 4 },
      },
      "章节分工移除：移除了 Aki 的校对分工",
    ],
    [
      {
        kind: "translation_imported",
        data: {
          format: "poprako",
          importedPageCount: 32,
          importedUnitCount: 120,
        },
      },
      "翻校数据导入：以 PopRaKo 格式导入了 32 页，共 120 个翻校单元",
    ],
    [
      {
        kind: "translation_exported",
        data: { format: "label_plus" },
      },
      "翻校数据导出：以 LabelPlus 格式导出",
    ],
    [
      {
        kind: "stage_transitioned",
        data: {
          stage: "translate",
          previousPhase: "active",
          nextPhase: "completed",
          origin: "translation_import",
        },
      },
      "翻译阶段已完成：翻校数据导入推进",
    ],
  ])("formats $kind", (event, expected) => {
    expect(formatWorkflowRecordEvent(event, userLabel)).toBe(expected);
  });

  test("formats a manual transition as an explicit action", () => {
    expect(formatWorkflowRecordEvent({
      kind: "stage_transitioned",
      data: {
        stage: "typeset_redraw",
        previousPhase: "pending",
        nextPhase: "active",
        origin: "manual",
      },
    })).toBe("嵌字阶段已开始：手动推进");
  });

  test("marks every displayed import payload value as variable", () => {
    const presentation = presentWorkflowRecordEvent({
      kind: "translation_imported",
      data: {
        format: "poprako",
        importedPageCount: 32,
        importedUnitCount: 120,
      },
    });

    expect(presentation.detail.filter(({ variable }) => variable)).toEqual([
      { text: "PopRaKo", variable: true },
      { text: "32", variable: true },
      { text: "120", variable: true },
    ]);
  });
});

describe("workflow record metadata", () => {
  test("shortens unresolved long user ids", () => {
    expect(shortWorkflowRecordUserId("user_1234567890abcdef")).toBe(
      "user_1…cdef",
    );
    expect(shortWorkflowRecordUserId("user_1")).toBe("user_1");
  });

  test("formats current and previous years", () => {
    const current = new Date(2026, 7, 18, 9, 5).getTime();
    const previous = new Date(2025, 11, 3, 21, 7).getTime();
    expect(formatWorkflowRecordTime(current, 2026)).toBe("08月18日 09:05");
    expect(formatWorkflowRecordTime(previous, 2026)).toBe(
      "2025年12月03日 21:07",
    );
  });

  test("collects and deduplicates actor and subject ids", () => {
    const record: ChapterWorkflowRecord = {
      id: "record_1",
      chapterId: "chapter_1",
      actorUserId: "subject_1",
      event: {
        kind: "assignment_created",
        data: { subjectUserId: "subject_1", roles: 2 },
      },
      createdAt: 1,
    };
    expect(workflowRecordUserIds(record)).toEqual(["subject_1"]);
  });
});
