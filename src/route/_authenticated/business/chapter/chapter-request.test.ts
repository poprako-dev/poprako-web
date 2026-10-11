import { createTestApi } from "@/test-resource/api-client";
import { describe, beforeEach, expect, test, vi } from "vitest";

import {
  exportChapter,
  getChapter,
  importChapter,
  updateChapter,
} from "@/route/_authenticated/business/chapter/chapter-request";
import { useAppStore } from "@/route/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import {
  bodyOf,
  fetchCallAt,
  installFetch,
  lastFetchCall,
  noContent,
  okJson,
} from "./test/chapter-request-test-helpers";

beforeEach(() => {
  vi.restoreAllMocks();
  useAppStore.getState().setAccessToken(null);
  useToastStore.getState().hideToast();
});

async function expectStageRequestEnums(): Promise<string> {
  const fetchMock = installFetch(noContent());
  await updateChapter(createTestApi("chapter-token"), "chapter_1", {
    workflowTransition: "upload_complete",
  });
  await updateChapter(createTestApi("chapter-token"), "chapter_1", {
    workflowTransition: "typeset_start",
  });

  expect(bodyOf(fetchCallAt(fetchMock, 0))).toEqual({
    id: "chapter_1",
    stage: "raw_provide",
    oper: "advance",
  });
  expect(bodyOf(fetchCallAt(fetchMock, 1))).toEqual({
    id: "chapter_1",
    stage: "typeset_redraw",
    oper: "advance",
  });
  return JSON.stringify(fetchMock.mock.calls);
}

async function expectImportRequestEnums(): Promise<string> {
  const fetchMock = installFetch(okJson({ imported_page_count: 1, imported_unit_count: 2 }));
  await importChapter(createTestApi("chapter-token"), {
    chapterId: "chapter_1",
    content: "{}",
    format: "json",
    mode: "keep",
  });
  await importChapter(createTestApi("chapter-token"), {
    chapterId: "chapter_1",
    content: "text",
    format: "lp",
    mode: "overwrite",
  });

  expect(bodyOf(fetchCallAt(fetchMock, 0))).toEqual({
    content: "{}",
    format: "poprako",
    mode: "keep",
  });
  expect(bodyOf(fetchCallAt(fetchMock, 1))).toEqual({
    content: "text",
    format: "label_plus",
    mode: "overwrite",
  });
  return JSON.stringify(fetchMock.mock.calls);
}

async function expectExportRequestEnums(): Promise<string> {
  const fetchMock = installFetch(
    Promise.resolve(
      Response.json({
        label_plus: "text",
        raw_idents: null,
        poprako: {
          comic_id: "comic_1",
          comic_title: "Comic",
          chapter_id: "chapter_1",
          chapter_index: 0,
          chapter_subtitle: "Chapter",
          pages: [],
        },
      }),
    ),
  );
  const result = await exportChapter(createTestApi("chapter-token"), "chapter_1");
  expect(lastFetchCall(fetchMock).url).toBe(
    "/api/v1/chapters/chapter_1/translations/export?format=poprako%2Clabel_plus",
  );
  expect(result).toEqual({
    success: true,
    data: {
      labelPlus: "text",
      rawIdents: [],
      poprako: {
        comicId: "comic_1",
        comicTitle: "Comic",
        chapterId: "chapter_1",
        chapterIndex: 0,
        chapterSubtitle: "Chapter",
        pages: [],
      },
    },
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return JSON.stringify(fetchMock.mock.calls);
}

describe("chapter API", () => {
  test("gets a chapter with auth and unwraps its comic context", async () => {
    useAppStore.getState().setAccessToken("chapter-token");
    const fetchMock = installFetch(
      okJson({
        id: "chapter_1",
        comic_id: "comic_1",
        creator_id: "user_1",
        index: 2,
        subtitle: "雨夜",
        page_count: 12,
        total_unit_count: 90,
        translated_unit_count: 60,
        proofread_unit_count: 30,
        is_pinned: true,
        stages: 21,
        created_at: 10,
        updated_at: 20,
      }),
    );

    const result = await getChapter(createTestApi("chapter-token"), "chapter_1");
    const call = lastFetchCall(fetchMock);

    expect(call.url).toBe("/api/v1/chapters/chapter_1");
    expect(new Headers(call.init?.headers).get("Authorization")).toBe("Bearer chapter-token");
    expect(result).toEqual({
      success: true,
      data: {
        id: "chapter_1",
        comicId: "comic_1",
        comic: undefined,
        creatorId: "user_1",
        creator: undefined,
        index: 2,
        subtitle: "雨夜",
        isPinned: true,
        pageCount: 12,
        totalUnitCount: 90,
        translatedUnitCount: 60,
        proofreadUnitCount: 30,
        stages: 21,
        createdAt: 10,
        updatedAt: 20,
      },
    });
  });
});

describe("chapter API", () => {
  test("uses only snake_case enum values in chapter requests", async () => {
    const serializedCalls = [
      await expectStageRequestEnums(),
      await expectImportRequestEnums(),
      await expectExportRequestEnums(),
    ].join();
    expect(serializedCalls).not.toContain("raw-provide");
    expect(serializedCalls).not.toContain("typeset-redraw");
    expect(serializedCalls).not.toContain("label-plus");
  });
});

describe("chapter API", () => {
  test("reports export 422 messages through the shared HTTP failure path", async () => {
    const showToast = vi.spyOn(useToastStore.getState(), "showToast");
    installFetch(
      Promise.resolve(
        Response.json(
          { message: "导出参数无效" },
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    await expect(exportChapter(createTestApi("chapter-token"), "chapter_1")).resolves.toEqual({
      success: false,
      error: "导出参数无效",
      httpStatus: 422,
      failureKind: "http",
    });
    expect(showToast).not.toHaveBeenCalled();
  });
});

describe("chapter API", () => {
  test("requests original image names when exporting", async () => {
    const fetchMock = installFetch(
      Promise.resolve(
        Response.json({
          label_plus: "text",
          raw_idents: [{ page_id: "page_1", raw_ident: "原稿 01.PNG" }],
          poprako: {
            comic_id: "comic_1",
            comic_title: "Comic",
            chapter_id: "chapter_1",
            chapter_index: 0,
            chapter_subtitle: "Chapter",
            pages: [],
          },
        }),
      ),
    );

    const result = await exportChapter(createTestApi("chapter-token"), "chapter_1", {
      withRawIdent: true,
    });

    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/chapters/chapter_1/translations/export" +
        "?format=poprako%2Clabel_plus&with_raw_ident=true",
    );
    expect(result.success && result.data.rawIdents).toEqual([
      { pageId: "page_1", rawIdent: "原稿 01.PNG" },
    ]);
  });
});
