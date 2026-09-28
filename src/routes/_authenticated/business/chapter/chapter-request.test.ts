import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  exportChapter,
  getChapter,
  importChapter,
  updateChapter,
} from "@/routes/_authenticated/business/chapter/chapter-request";
import { useAppStore } from "@/routes/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import {
  bodyOf,
  fetchCallAt,
  installFetch,
  lastFetchCall,
  noContent,
  okJson,
} from "./test/chapter-request-test-helpers";

describe("chapter API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.getState().setAccessToken(null);
    useToastStore.getState().hideToast();
  });

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

    const result = await getChapter("chapter_1");
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

  test("uses only snake_case enum values in chapter requests", async () => {
    const stageFetch = installFetch(noContent());

    await updateChapter("chapter_1", { workflowTransition: "upload_complete" });
    await updateChapter("chapter_1", { workflowTransition: "typeset_start" });

    expect(bodyOf(fetchCallAt(stageFetch, 0))).toEqual({
      id: "chapter_1",
      stage: "raw_provide",
      oper: "advance",
    });
    expect(bodyOf(fetchCallAt(stageFetch, 1))).toEqual({
      id: "chapter_1",
      stage: "typeset_redraw",
      oper: "advance",
    });

    const importFetch = installFetch(
      okJson({
        imported_page_count: 1,
        imported_unit_count: 2,
      }),
    );

    await importChapter({
      chapterId: "chapter_1",
      content: "{}",
      format: "json",
      mode: "keep",
    });
    await importChapter({
      chapterId: "chapter_1",
      content: "text",
      format: "lp",
      mode: "overwrite",
    });

    expect(bodyOf(fetchCallAt(importFetch, 0))).toEqual({
      content: "{}",
      format: "poprako",
      mode: "keep",
    });
    expect(bodyOf(fetchCallAt(importFetch, 1))).toEqual({
      content: "text",
      format: "label_plus",
      mode: "overwrite",
    });

    const exportFetch = installFetch(
      Promise.resolve(
        Response.json(
          {
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
          },
          { status: 200 },
        ),
      ),
    );
    const exportResult = await exportChapter("chapter_1");
    expect(lastFetchCall(exportFetch).url).toBe(
      "/api/v1/chapters/chapter_1/translations/export?format=poprako,label_plus",
    );
    expect(exportResult).toEqual({
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
    expect(exportFetch).toHaveBeenCalledTimes(1);

    const serializedCalls = JSON.stringify([
      ...stageFetch.mock.calls,
      ...importFetch.mock.calls,
      ...exportFetch.mock.calls,
    ]);
    expect(serializedCalls).not.toContain("raw-provide");
    expect(serializedCalls).not.toContain("typeset-redraw");
    expect(serializedCalls).not.toContain("label-plus");
  });

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

    await expect(exportChapter("chapter_1")).resolves.toEqual({
      success: false,
      error: "导出参数无效",
      httpStatus: 422,
    });
    expect(showToast).toHaveBeenCalledOnce();
    expect(showToast).toHaveBeenCalledWith("导出参数无效", "error");
  });

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

    const result = await exportChapter("chapter_1", { withRawIdent: true });

    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/chapters/chapter_1/translations/export" +
        "?format=poprako,label_plus&with_raw_ident=true",
    );
    expect(result.success && result.data.rawIdents).toEqual([
      { pageId: "page_1", rawIdent: "原稿 01.PNG" },
    ]);
  });
});
