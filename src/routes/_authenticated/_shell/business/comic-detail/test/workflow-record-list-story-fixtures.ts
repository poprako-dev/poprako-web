import { fn } from "storybook/test";
import type { WorkflowRecordState } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-workflow-records";
import { shortWorkflowRecordUserId } from "@/routes/_authenticated/_shell/business/comic-detail/workflow-record";
import type {
  ChapterWorkflowRecord,
  ChapterWorkflowRecordEvent,
} from "@/routes/_authenticated/business/chapter/chapter-workflow-record";
import { roleMask } from "@/routes/business/identity/role";

export const CHAPTER_ID = "chapter_story";
export const NOW = new Date(2026, 7, 19, 10, 30).getTime();
export const LONG_SUBTITLE = "在黎明到来之前所有未被说出口的约定与漫长告别都会再次相遇";

const USER_NAMES: Record<string, string> = {
  actor_admin: "Mori",
  actor_translator: "Aki",
  actor_long: "Bartholomew Thaddeus McAllister IV",
  subject_aki: "Aki",
  subject_former: "已退出成员",
};

export function getUserLabel(userId: string): string {
  return USER_NAMES[userId] ?? shortWorkflowRecordUserId(userId);
}

function makeRecord(
  id: string,
  event: ChapterWorkflowRecordEvent,
  options: {
    actorUserId?: string | null | undefined;
    createdAt?: number | undefined;
  } = {},
): ChapterWorkflowRecord {
  return {
    id,
    chapterId: CHAPTER_ID,
    actorUserId: options.actorUserId === undefined ? "actor_admin" : options.actorUserId,
    event,
    createdAt: options.createdAt ?? NOW,
  };
}

export function makeState(overrides: Partial<WorkflowRecordState> = {}): WorkflowRecordState {
  return {
    records: [],
    hasMore: false,
    loadedOnce: true,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    loadMoreError: null,
    ...overrides,
  };
}

export const ALL_EVENT_RECORDS: ChapterWorkflowRecord[] = [
  makeRecord(
    "record_12",
    {
      kind: "stage_transitioned",
      data: {
        stage: "typeset_redraw",
        previousPhase: "active",
        nextPhase: "completed",
        origin: "artwork_upload",
      },
    },
    { actorUserId: "actor_translator", createdAt: NOW },
  ),
  makeRecord(
    "record_11",
    {
      kind: "artwork_exported",
      data: { artworkVersion: 7 },
    },
    { actorUserId: "actor_translator", createdAt: NOW - 5 * 60_000 },
  ),
  makeRecord(
    "record_10",
    {
      kind: "stage_transitioned",
      data: {
        stage: "translate",
        previousPhase: "active",
        nextPhase: "completed",
        origin: "translation_import",
      },
    },
    { actorUserId: "actor_translator", createdAt: NOW },
  ),
  makeRecord(
    "record_9",
    {
      kind: "translation_exported",
      data: { formats: { labelPlus: true, poprako: true } },
    },
    { actorUserId: "actor_translator", createdAt: NOW - 15 * 60_000 },
  ),
  makeRecord(
    "record_8",
    {
      kind: "translation_imported",
      data: {
        format: "poprako",
        importedPageCount: 32,
        importedUnitCount: 120,
      },
    },
    { actorUserId: "actor_translator", createdAt: NOW - 30 * 60_000 },
  ),
  makeRecord(
    "record_7",
    {
      kind: "assignment_deleted",
      data: {
        subjectUserId: "subject_former",
        previousRoles: roleMask(["proofreader"]),
      },
    },
    { createdAt: NOW - 45 * 60_000 },
  ),
  makeRecord(
    "record_6",
    {
      kind: "assignment_roles_updated",
      data: {
        subjectUserId: "subject_aki",
        previousRoles: roleMask(["translator"]),
        nextRoles: roleMask(["translator", "proofreader"]),
      },
    },
    { createdAt: NOW - 60 * 60_000 },
  ),
  makeRecord(
    "record_5",
    {
      kind: "assignment_created",
      data: {
        subjectUserId: "subject_aki",
        roles: roleMask(["translator"]),
      },
    },
    { createdAt: NOW - 75 * 60_000 },
  ),
  makeRecord("record_4", { kind: "chapter_unpinned" }, { createdAt: NOW - 90 * 60_000 }),
  makeRecord("record_3", { kind: "chapter_pinned" }, { createdAt: NOW - 105 * 60_000 }),
  makeRecord(
    "record_2",
    {
      kind: "chapter_subtitle_updated",
      data: { previousSubtitle: "", nextSubtitle: "深渊回响" },
    },
    { createdAt: NOW - 120 * 60_000 },
  ),
  makeRecord(
    "record_1",
    { kind: "chapter_created" },
    { actorUserId: null, createdAt: NOW - 135 * 60_000 },
  ),
];

export const EDGE_RECORDS: ChapterWorkflowRecord[] = [
  makeRecord(
    "edge_long_subtitle",
    {
      kind: "chapter_subtitle_updated",
      data: {
        previousSubtitle: "无声序章",
        nextSubtitle: LONG_SUBTITLE,
      },
    },
    { actorUserId: "actor_long" },
  ),
  makeRecord(
    "edge_all_roles",
    {
      kind: "assignment_created",
      data: {
        subjectUserId: "subject_aki",
        roles: roleMask([
          "rawProvider",
          "translator",
          "proofreader",
          "typesetter",
          "redrawer",
          "reviewer",
          "publisher",
          "admin",
        ]),
      },
    },
    { createdAt: NOW - 20 * 60_000 },
  ),
  makeRecord(
    "edge_manual",
    {
      kind: "stage_transitioned",
      data: {
        stage: "typeset_redraw",
        previousPhase: "pending",
        nextPhase: "active",
        origin: "manual",
      },
    },
    { createdAt: NOW - 40 * 60_000 },
  ),
  makeRecord(
    "edge_raw_check",
    {
      kind: "stage_transitioned",
      data: {
        stage: "raw_provide",
        previousPhase: "active",
        nextPhase: "completed",
        origin: "raw_provide_check",
      },
    },
    { createdAt: NOW - 60 * 60_000 },
  ),
  makeRecord(
    "edge_fallback",
    { kind: "chapter_pinned" },
    {
      actorUserId: "user_workflow_1234567890abcdef",
      createdAt: NOW - 80 * 60_000,
    },
  ),
  makeRecord(
    "edge_system",
    { kind: "chapter_created" },
    {
      actorUserId: null,
      createdAt: new Date(2025, 11, 3, 21, 7).getTime(),
    },
  ),
];

function makePaginationRecords(
  prefix: string,
  count: number,
  startMinute: number,
): ChapterWorkflowRecord[] {
  return Array.from({ length: count }, (_, index) =>
    makeRecord(
      `${prefix}_${String(index + 1)}`,
      {
        kind: "chapter_subtitle_updated",
        data: {
          previousSubtitle: index === 0 ? "" : `${prefix} ${String(index)}`,
          nextSubtitle: `${prefix} ${String(index + 1)}`,
        },
      },
      { createdAt: NOW - (startMinute + index) * 60_000 },
    ),
  );
}

export const FIRST_PAGE = makePaginationRecords("最新记录", 16, 0);
export const SECOND_PAGE = makePaginationRecords("更早记录", 8, 30);
export const paginationLoadMore = fn();
