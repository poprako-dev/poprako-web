import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  exportChapter,
  exportChapterLp,
  importChapter,
  listChapterWorkflowRecords,
  updateChapter,
} from "./chapter";

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function okJson(data: unknown): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify({ code: 0, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function noContent(): Promise<Response> {
  return Promise.resolve(new Response(null, { status: 204 }));
}

function installFetch(response: Promise<Response>) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    return response.then((value) => value.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function fetchCallAt(
  fetchMock: ReturnType<typeof installFetch>,
  index: number,
): FetchCall {
  const call = fetchMock.mock.calls[index];
  expect(call).toBeDefined();
  return {
    url: String(call![0]),
    init: call![1] as RequestInit | undefined,
  };
}

function lastFetchCall(fetchMock: ReturnType<typeof installFetch>): FetchCall {
  return fetchCallAt(fetchMock, fetchMock.mock.calls.length - 1);
}

function bodyOf(call: FetchCall): unknown {
  return JSON.parse(String(call.init?.body));
}

describe("chapter API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("lists and unwraps every adjacent-tagged workflow event", async () => {
    const fetchMock = installFetch(okJson([
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
          data: { format: "poprako" },
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
    ]));

    const result = await listChapterWorkflowRecords({
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
            data: { format: "poprako" },
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

    const importFetch = installFetch(okJson({
      imported_page_count: 1,
      imported_unit_count: 2,
    }));

    await importChapter({ chapterId: "chapter_1", content: "{}", format: "json" });
    await importChapter({ chapterId: "chapter_1", content: "text", format: "lp" });

    expect(bodyOf(fetchCallAt(importFetch, 0))).toEqual({
      chapter_id: "chapter_1",
      content: "{}",
      format: "poprako",
    });
    expect(bodyOf(fetchCallAt(importFetch, 1))).toEqual({
      chapter_id: "chapter_1",
      content: "text",
      format: "label_plus",
    });

    const poprakoExportFetch = installFetch(Promise.resolve(
      new Response(JSON.stringify({
        comic_id: "comic_1",
        comic_title: "Comic",
        chapter_id: "chapter_1",
        chapter_index: 0,
        chapter_subtitle: "Chapter",
        pages: [],
      }), { status: 200 }),
    ));
    await exportChapter("chapter_1");
    expect(lastFetchCall(poprakoExportFetch).url).toBe(
      "/api/v1/chapters/chapter_1/translations/export?format=poprako",
    );

    const labelPlusExportFetch = installFetch(Promise.resolve(
      new Response("text", { status: 200 }),
    ));
    await exportChapterLp("chapter_1");
    expect(lastFetchCall(labelPlusExportFetch).url).toBe(
      "/api/v1/chapters/chapter_1/translations/export?format=label_plus",
    );

    const serializedCalls = JSON.stringify([
      ...stageFetch.mock.calls,
      ...importFetch.mock.calls,
      ...poprakoExportFetch.mock.calls,
      ...labelPlusExportFetch.mock.calls,
    ]);
    expect(serializedCalls).not.toContain("raw-provide");
    expect(serializedCalls).not.toContain("typeset-redraw");
    expect(serializedCalls).not.toContain("label-plus");
  });
});
