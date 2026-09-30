import { createTestApi } from "@/test-resource/api-client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  bodyOf,
  installFetch,
  lastFetchCall,
  noContent,
  okJson,
} from "@/route/business/test/account-contract-test-utils";

import { listMyMembers } from "@/route/business/identity/member-request";
import { listSysMails } from "@/api/system-mail";
import {
  exportChapter,
  importChapter,
  updateChapter,
} from "@/route/_authenticated/business/chapter/chapter-request";
import { listComics } from "@/route/_authenticated/business/comic/comic-request";
import {
  listUnits,
  saveUnits,
} from "@/route/_authenticated/translator/business/remote/translator-request";
import { completeChapterStage } from "@/route/_authenticated/business/chapter/chapter-request";
import type { UnitDiff } from "@/route/_authenticated/translator/business/contract/type";

describe("workflow and value contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("saves units with sparse create-patch-delete edits", async () => {
    const fetchMock = installFetch(
      okJson({
        created_unit_ids: [{ local_id: "local_1", unit_id: "permanent_1" }],
      }),
    );
    const diff: UnitDiff = {
      ops: [
        {
          edit: "create",
          localId: "local_1",
          nextId: "unit_1",
          isBubble: true,
          isFlagged: false,
          coord: { xCoord: 0.1, yCoord: 0.2 },
          translation: { translatedText: "hello" },
        },
        {
          edit: "patch",
          id: "unit_1",
          nextId: { type: "clear" },
          isBubble: false,
          isFlagged: false,
          coord: { xCoord: 0.3, yCoord: 0.4 },
          translation: { type: "clear" },
          revision: {
            type: "assign",
            value: { isProofread: true, proofreadText: "done" },
          },
        },
        { edit: "delete", id: "unit_deleted" },
      ],
    };

    const result = await saveUnits(createTestApi(), "page_1", diff, "save_1");

    expect(result).toEqual({
      success: true,
      data: {
        createdUnitIds: [{ localId: "local_1", unitId: "permanent_1" }],
      },
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/pages/page_1/units/save?save_id=save_1");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual([
      {
        edit: "create",
        local_id: "local_1",
        next_id: "unit_1",
        is_bubble: true,
        is_flagged: false,
        coord: { x_coord: 0.1, y_coord: 0.2 },
        translation: { translated_text: "hello" },
      },
      {
        edit: "patch",
        id: "unit_1",
        next_id: { type: "clear" },
        is_bubble: false,
        is_flagged: false,
        coord: { x_coord: 0.3, y_coord: 0.4 },
        translation: { type: "clear" },
        revision: { type: "assign", value: { is_proofread: true, proofread_text: "done" } },
      },
      { edit: "delete", id: "unit_deleted" },
    ]);
  });

  test("maps renamed poprako-r response fields", async () => {
    installFetch(
      okJson({
        unit_infos: [
          {
            id: "unit_1",
            page_id: "page_1",
            index: 0,
            is_bubble: true,
            is_flagged: false,
            is_proofread: false,
            x_coord: 0.1,
            y_coord: 0.2,
            translated_text: "hello",
            created_at: 1,
            updated_at: 2,
          },
        ],
        total_unit_count: 1,
        translated_unit_count: 1,
        proofread_unit_count: 0,
      }),
    );
    const units = await listUnits(createTestApi(), "page_1");
    expect(units.success && units.data.units[0]?.id).toBe("unit_1");

    let fetchMock: ReturnType<typeof installFetch> = installFetch(
      okJson([
        {
          id: "member_1",
          user_id: "user_1",
          nickname: "member",
          last_active_at: 1,
          team_id: "team_1",
          roles: 128,
          created_at: 1,
          updated_at: 2,
          team: {
            id: "team_1",
            name: "Team",
            description: "Desc",
            avatar_url: null,
            created_at: 1,
            updated_at: 2,
          },
        },
      ]),
    );
    const members = await listMyMembers(createTestApi(), {
      offset: 0,
      limit: 20,
      includes: ["team"],
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/members/me?offset=0&limit=20&incl=team");
    if (!members.success) throw new Error(members.error);
    expect(members.data[0]?.roles).toBe(128);
    expect(members.data[0]?.team?.id).toBe("team_1");

    fetchMock = installFetch(
      okJson([
        {
          id: "mail_1",
          title: "T",
          content: "C",
          is_read: false,
          created_at: 1,
        },
      ]),
    );
    const mails = await listSysMails(createTestApi(), 0, 10, false);
    expect(lastFetchCall(fetchMock).url).toBe(
      "/api/v1/system-mails?is_read=false&offset=0&limit=10",
    );
    expect(mails.success && mails.data[0]?.isRead).toBe(false);

    fetchMock = installFetch(
      Promise.resolve(
        Response.json(
          {
            label_plus: "text",
            raw_idents: null,
            poprako: {
              comic_id: "comic_1",
              chapter_id: "chapter_1",
              comic_title: "Comic",
              chapter_index: 0,
              chapter_subtitle: "Chapter",
              pages: [],
            },
          },
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );
    const exported = await exportChapter(createTestApi(), "chapter_1");
    expect(exported.success && exported.data.poprako.chapterId).toBe("chapter_1");

    expect(fetchMock).toHaveBeenCalled();
  });

  test("uses chapter stage/import export routes from poprako-r", async () => {
    const fetchMock = installFetch(noContent());

    await updateChapter(createTestApi(), "chapter_1", { subtitle: "new" });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1");
    expect(lastFetchCall(fetchMock).init?.method).toBe("PATCH");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      id: "chapter_1",
      subtitle: "new",
    });

    await updateChapter(createTestApi(), "chapter_1", { isPinned: true });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/mark-pinned");
    expect(lastFetchCall(fetchMock).init?.method).toBe("POST");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({});

    await completeChapterStage(createTestApi(), "chapter_1", {
      stage: "proofread",
      oper: "advance",
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/stage/advance");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      id: "chapter_1",
      stage: "proofread",
      oper: "advance",
    });

    fetchMock.mockResolvedValueOnce(
      okJson({
        imported_page_count: 1,
        imported_unit_count: 2,
      }).clone(),
    );
    await importChapter(createTestApi(), {
      chapterId: "chapter_1",
      content: "x",
      format: "lp",
      mode: "keep",
    });
    expect(lastFetchCall(fetchMock).url).toBe("/api/v1/chapters/chapter_1/translations/import");
    expect(bodyOf(lastFetchCall(fetchMock))).toEqual({
      content: "x",
      format: "label_plus",
      mode: "keep",
    });

    const exportFetchMock = installFetch(okJson({}));
    await exportChapter(createTestApi(), "chapter_1");
    expect(lastFetchCall(exportFetchMock).url).toBe(
      "/api/v1/chapters/chapter_1/translations/export?format=poprako%2Clabel_plus",
    );
  });

  test("zips list comics response with parallel pinned chapters", async () => {
    installFetch(
      okJson({
        comics: [
          {
            id: "comic_1",
            workset_id: "workset_1",
            index: 0,
            title: "Comic One",
            author: "Author",
            description: null,
            cover_url: null,
            is_archived: false,
            chapter_count: 3,
            creator_id: "user_1",
            last_active_at: 1,
            created_at: 2,
            updated_at: 3,
          },
          {
            id: "comic_2",
            workset_id: "workset_1",
            index: 1,
            title: "Comic Two",
            author: "Author",
            description: null,
            cover_url: null,
            is_archived: false,
            chapter_count: 1,
            creator_id: "user_1",
            last_active_at: 4,
            created_at: 5,
            updated_at: 6,
          },
        ],
        pinned_chapters: [
          {
            id: "chapter_1",
            comic_id: "comic_1",
            index: 0,
            subtitle: "Ch1",
            page_count: 2,
            is_pinned: true,
            stages: 0,
            creator_id: "user_1",
            total_unit_count: 0,
            translated_unit_count: 0,
            proofread_unit_count: 0,
            created_at: 1,
            updated_at: 2,
          },
          null,
        ],
        pinned_chapter_assignments: [],
      }),
    );

    const result = await listComics(createTestApi(), {
      worksetId: "workset_1",
      withs: ["pinned_chapter"],
      offset: 0,
      limit: 10,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("unreachable");
    }

    expect(result.data).toHaveLength(2);
    expect(result.data[0]?.id).toBe("comic_1");
    expect(result.data[0]?.pinnedChapter?.id).toBe("chapter_1");
    expect(result.data[1]?.id).toBe("comic_2");
    expect(result.data[1]?.pinnedChapter).toBeUndefined();
  });
});
