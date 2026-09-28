import { createTestApi } from "@/test-resource/api-client";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { listChapterWorkflowRecords } from "@/route/_authenticated/business/chapter/chapter-request";
import { useAppStore } from "@/route/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { installFetch, lastFetchCall, okJson } from "./test/chapter-request-test-helpers";

describe("chapter workflow records API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.getState().setAccessToken(null);
    useToastStore.getState().hideToast();
  });

  test("lists and unwraps every adjacent-tagged workflow event", async () => {
    const fetchMock = installFetch(
      okJson([
        {
          id: "record_12",
          chapter_id: "chapter_1",
          actor_user_id: "user_2",
          event: {
            kind: "artwork_exported",
            data: { artwork_version: 7 },
          },
          created_at: 12,
        },
        {
          id: "record_11",
          chapter_id: "chapter_1",
          actor_user_id: "user_2",
          event: {
            kind: "stage_transitioned",
            data: {
              stage: "typeset_redraw",
              previous_phase: "active",
              next_phase: "completed",
              origin: "artwork_upload",
            },
          },
          created_at: 11,
        },
        {
          id: "record_10",
          chapter_id: "chapter_1",
          actor_user_id: "user_1",
          event: { kind: "chapter_created" },
          created_at: 10,
        },
        {
          id: "record_9",
          chapter_id: "chapter_1",
          actor_user_id: "user_1",
          event: {
            kind: "chapter_subtitle_updated",
            data: {
              previous_subtitle: "Old",
              next_subtitle: "New",
            },
          },
          created_at: 9,
        },
        {
          id: "record_8",
          chapter_id: "chapter_1",
          actor_user_id: "user_1",
          event: { kind: "chapter_pinned" },
          created_at: 8,
        },
        {
          id: "record_7",
          chapter_id: "chapter_1",
          actor_user_id: null,
          event: { kind: "chapter_unpinned" },
          created_at: 7,
        },
        {
          id: "record_6",
          chapter_id: "chapter_1",
          actor_user_id: "user_2",
          event: {
            kind: "assignment_created",
            data: { subject_user_id: "user_3", roles: 2 },
          },
          created_at: 6,
        },
        {
          id: "record_5",
          chapter_id: "chapter_1",
          actor_user_id: "user_2",
          event: {
            kind: "assignment_roles_updated",
            data: {
              subject_user_id: "user_3",
              previous_roles: 2,
              next_roles: 6,
            },
          },
          created_at: 5,
        },
        {
          id: "record_4",
          chapter_id: "chapter_1",
          actor_user_id: "user_2",
          event: {
            kind: "assignment_deleted",
            data: { subject_user_id: "user_3", previous_roles: 6 },
          },
          created_at: 4,
        },
        {
          id: "record_3",
          chapter_id: "chapter_1",
          actor_user_id: "user_2",
          event: {
            kind: "translation_imported",
            data: {
              format: "label_plus",
              imported_page_count: 32,
              imported_unit_count: 120,
            },
          },
          created_at: 3,
        },
        {
          id: "record_2",
          chapter_id: "chapter_1",
          actor_user_id: "user_2",
          event: {
            kind: "translation_exported",
            data: {
              formats: {
                label_plus: true,
                poprako: true,
              },
            },
          },
          created_at: 2,
        },
        {
          id: "record_1",
          chapter_id: "chapter_1",
          actor_user_id: "user_2",
          event: {
            kind: "stage_transitioned",
            data: {
              stage: "typeset_redraw",
              previous_phase: "active",
              next_phase: "completed",
              origin: "translation_export",
            },
          },
          created_at: 1,
        },
      ]),
    );

    const result = await listChapterWorkflowRecords(createTestApi(), {
      chapterId: "chapter_1",
      offset: 20,
      limit: 10,
    });

    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/chapters/chapter_1/workflow-records?offset=20&limit=10",
    );
    expect(result).toEqual({
      success: true,
      data: [
        {
          id: "record_12",
          chapterId: "chapter_1",
          actorUserId: "user_2",
          event: {
            kind: "artwork_exported",
            data: { artworkVersion: 7 },
          },
          createdAt: 12,
        },
        {
          id: "record_11",
          chapterId: "chapter_1",
          actorUserId: "user_2",
          event: {
            kind: "stage_transitioned",
            data: {
              stage: "typeset_redraw",
              previousPhase: "active",
              nextPhase: "completed",
              origin: "artwork_upload",
            },
          },
          createdAt: 11,
        },
        {
          id: "record_10",
          chapterId: "chapter_1",
          actorUserId: "user_1",
          event: { kind: "chapter_created" },
          createdAt: 10,
        },
        {
          id: "record_9",
          chapterId: "chapter_1",
          actorUserId: "user_1",
          event: {
            kind: "chapter_subtitle_updated",
            data: { previousSubtitle: "Old", nextSubtitle: "New" },
          },
          createdAt: 9,
        },
        {
          id: "record_8",
          chapterId: "chapter_1",
          actorUserId: "user_1",
          event: { kind: "chapter_pinned" },
          createdAt: 8,
        },
        {
          id: "record_7",
          chapterId: "chapter_1",
          actorUserId: null,
          event: { kind: "chapter_unpinned" },
          createdAt: 7,
        },
        {
          id: "record_6",
          chapterId: "chapter_1",
          actorUserId: "user_2",
          event: {
            kind: "assignment_created",
            data: { subjectUserId: "user_3", roles: 2 },
          },
          createdAt: 6,
        },
        {
          id: "record_5",
          chapterId: "chapter_1",
          actorUserId: "user_2",
          event: {
            kind: "assignment_roles_updated",
            data: {
              subjectUserId: "user_3",
              previousRoles: 2,
              nextRoles: 6,
            },
          },
          createdAt: 5,
        },
        {
          id: "record_4",
          chapterId: "chapter_1",
          actorUserId: "user_2",
          event: {
            kind: "assignment_deleted",
            data: { subjectUserId: "user_3", previousRoles: 6 },
          },
          createdAt: 4,
        },
        {
          id: "record_3",
          chapterId: "chapter_1",
          actorUserId: "user_2",
          event: {
            kind: "translation_imported",
            data: {
              format: "label_plus",
              importedPageCount: 32,
              importedUnitCount: 120,
            },
          },
          createdAt: 3,
        },
        {
          id: "record_2",
          chapterId: "chapter_1",
          actorUserId: "user_2",
          event: {
            kind: "translation_exported",
            data: {
              formats: {
                labelPlus: true,
                poprako: true,
              },
            },
          },
          createdAt: 2,
        },
        {
          id: "record_1",
          chapterId: "chapter_1",
          actorUserId: "user_2",
          event: {
            kind: "stage_transitioned",
            data: {
              stage: "typeset_redraw",
              previousPhase: "active",
              nextPhase: "completed",
              origin: "translation_export",
            },
          },
          createdAt: 1,
        },
      ],
    });
  });
});
