import { describe, expect, test } from "vitest";
import type {
  ChapterWorkflowRecord,
  ChapterWorkflowRecordEvent,
} from "@/types/chapterWorkflowRecord";
import {
  formatWorkflowRecordEvent,
  formatWorkflowRecordTime,
  shortWorkflowRecordUserId,
  workflowRecordUserIds,
} from "./workflowRecord";

const userLabel = (userId: string) => ({
  actor_1: "Mori",
  subject_1: "Aki",
})[userId] ?? userId;

describe("formatWorkflowRecordEvent", () => {
  test.each<[ChapterWorkflowRecordEvent, string]>([
    [{ kind: "chapter_created" }, "创建了章节"],
    [
      {
        kind: "chapter_subtitle_updated",
        data: { previousSubtitle: "", nextSubtitle: "终幕" },
      },
      "将章节副标题从“无副标题”修改为“终幕”",
    ],
    [{ kind: "chapter_pinned" }, "将章节设为置顶"],
    [{ kind: "chapter_unpinned" }, "取消了章节置顶"],
    [
      {
        kind: "assignment_created",
        data: { subjectUserId: "subject_1", roles: 2 },
      },
      "为 Aki 分配了翻译分工",
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
      "将 Aki 的分工从“翻译”调整为“翻译、校对”",
    ],
    [
      {
        kind: "assignment_deleted",
        data: { subjectUserId: "subject_1", previousRoles: 4 },
      },
      "移除了 Aki 的校对分工",
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
      "导入了 PopRaKo 数据（32 页，120 个单元）",
    ],
    [
      {
        kind: "translation_exported",
        data: { format: "label_plus" },
      },
      "导出了 LabelPlus 数据",
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
      "因翻译导入，翻译阶段从“进行中”变为“已完成”",
    ],
  ])("formats $kind", (event, expected) => {
    expect(formatWorkflowRecordEvent(event, userLabel)).toBe(expected);
  });

  test("omits the manual transition origin", () => {
    expect(formatWorkflowRecordEvent({
      kind: "stage_transitioned",
      data: {
        stage: "typeset_redraw",
        previousPhase: "pending",
        nextPhase: "active",
        origin: "manual",
      },
    })).toBe("嵌字阶段从“待开始”变为“进行中”");
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
