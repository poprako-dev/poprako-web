import { createTestApi } from "@/test-resource/api-client";
import { describe, beforeEach, expect, test, vi } from "vitest";

import { listChapterWorkflowRecords } from "@/route/_authenticated/business/chapter/chapter-request";
import { useAppStore } from "@/route/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { installFetch, lastFetchCall, okJson } from "./test/chapter-request-test-helpers";
import {
  chapterWorkflowExpected,
  chapterWorkflowPayload,
} from "./test/chapter-workflow-records-test-data";

beforeEach(() => {
  vi.restoreAllMocks();
  useAppStore.getState().setAccessToken(null);
  useToastStore.getState().hideToast();
});

describe("chapter workflow records API", () => {
  test("lists and unwraps every adjacent-tagged workflow event", async () => {
    const fetchMock = installFetch(okJson(chapterWorkflowPayload));

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
      data: chapterWorkflowExpected,
    });
  });
});
